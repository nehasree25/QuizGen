from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .serializers import QuizGenerationSerializer, QuizHistorySerializer, ResumeQuizSerializer
from .models import QuizHistory
from .services import AIService


# ---------- Generate Quiz ----------
@swagger_auto_schema(method='post', request_body=QuizGenerationSerializer)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request):
    serializer = QuizGenerationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    data = serializer.validated_data

    # Check for incomplete quiz
    existing_quiz = QuizHistory.objects.filter(
        user=request.user,
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        status='incomplete'
    ).first()

    if existing_quiz:
        return Response({
            "message": "Incomplete quiz found. Resuming...",
            "quiz_id": existing_quiz.id,
            "questions": existing_quiz.questions,
            "user_answers": existing_quiz.user_answers or [],
            "current_question_index": existing_quiz.current_question_index or 0,
        }, status=status.HTTP_200_OK)

    # Generate new quiz
    ai_service = AIService()
    result = ai_service.generate_quiz_questions(
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        number_of_questions=data['number_of_questions'],
        level=data['level']
    )

    if isinstance(result, dict) and 'error' in result:
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Ensure the number of questions matches requested
    questions = result if isinstance(result, list) else []
    num_required = data['number_of_questions']

    while len(questions) < num_required:
        questions.append({
            "question": f"Placeholder question {len(questions)+1}",
            "question_type": "single",
            "correct_answer": "N/A",
            "correct_answers": ["N/A"],
            "explanation": "Auto-generated placeholder."
        })

    quiz = QuizHistory.objects.create(
        user=request.user,
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        questions=questions,
        user_answers=[],
        current_question_index=0,
        status='incomplete'
    )

    return Response({
        "message": "New quiz generated.",
        "quiz_id": quiz.id,
        "questions": questions,
        "user_answers": [],
        "current_question_index": 0,
    }, status=status.HTTP_200_OK)



# ---------- Save Quiz Progress ----------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_quiz_progress(request, quiz_id):
    """
    Save user's current progress (answers + question index).
    """
    quiz = get_object_or_404(QuizHistory, id=quiz_id, user=request.user)
    data = request.data

    quiz.user_answers = data.get('user_answers', quiz.user_answers)
    quiz.current_question_index = data.get('current_question_index', quiz.current_question_index)
    quiz.save(update_fields=['user_answers', 'current_question_index', 'updated_at'])

    return Response({"message": "Progress saved successfully."}, status=status.HTTP_200_OK)


# ---------- Mark Quiz Complete ----------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_quiz_complete(request, quiz_id):
    """
    Mark quiz as completed and calculate score (order-insensitive, case-insensitive).
    """
    quiz = get_object_or_404(QuizHistory, id=quiz_id, user=request.user)
    data = request.data

    if 'user_answers' in data:
        user_answers = data['user_answers']
        quiz.user_answers = user_answers

        total_questions = len(quiz.questions)
        correct_count = 0

        for i, question in enumerate(quiz.questions):
            if i < len(user_answers):
                normalize = lambda arr: set(str(a).strip().lower() for a in arr)
                user_ans = normalize(user_answers[i])
                correct_ans = normalize(question.get('correct_answers', []))
                if user_ans == correct_ans:
                    correct_count += 1

        quiz.score = round((correct_count / total_questions) * 100, 2) if total_questions > 0 else 0

    quiz.status = 'completed'
    quiz.current_question_index = len(quiz.questions)
    quiz.save()

    serializer = QuizHistorySerializer(quiz)
    return Response({
        "message": "Quiz completed successfully.",
        **serializer.data
    }, status=status.HTTP_200_OK)


# ---------- Get Quiz History ----------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_history(request):
    domain = request.query_params.get('domain')
    sub_domain = request.query_params.get('sub_domain')

    quizzes = QuizHistory.objects.filter(user=request.user)
    if domain:
        quizzes = quizzes.filter(domain=domain)
    if sub_domain:
        quizzes = quizzes.filter(sub_domain=sub_domain)

    serializer = QuizHistorySerializer(quizzes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ---------- Resume Quiz ----------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_quiz(request):
    """
    Resume the last incomplete quiz.
    """
    serializer = ResumeQuizSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    quiz = QuizHistory.objects.filter(
        user=request.user,
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        status='incomplete'
    ).first()

    if not quiz:
        return Response({"message": "No incomplete quiz found."}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "quiz_id": quiz.id,
        "questions": quiz.questions,
        "user_answers": quiz.user_answers or [],
        "current_question_index": quiz.current_question_index or 0,
        "status": quiz.status,
    }, status=status.HTTP_200_OK)
