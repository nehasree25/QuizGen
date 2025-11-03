from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import QuizGenerationSerializer, QuizHistorySerializer, ResumeQuizSerializer
from .models import QuizHistory
from .services import AIService


@swagger_auto_schema(
    method='post',
    operation_description="Generate quiz using AI",
    request_body=QuizGenerationSerializer,
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request):
    serializer = QuizGenerationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    # Check if there’s an incomplete quiz already
    existing_quiz = QuizHistory.objects.filter(
        user=request.user,
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        status='incomplete'
    ).first()

    if existing_quiz:
        return Response({
            "message": "Incomplete quiz found. Please resume instead.",
            "quiz_id": existing_quiz.id,
            "questions": existing_quiz.questions
        }, status=status.HTTP_200_OK)

    # Generate new quiz via AI
    ai_service = AIService()
    result = ai_service.generate_quiz_questions(
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        number_of_questions=data['number_of_questions'],
        level=data['level']
    )

    if isinstance(result, dict) and 'error' in result:
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Save new quiz to history
    quiz = QuizHistory.objects.create(
        user=request.user,
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        questions=result,
        status='incomplete'
    )

    return Response({
        "message": "Quiz generated and saved to history.",
        "quiz_id": quiz.id,
        "questions": result
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_quiz_complete(request, quiz_id):
    try:
        quiz = QuizHistory.objects.get(id=quiz_id, user=request.user)
        data = request.data

        if 'user_answers' in data:
            user_answers = data['user_answers']
            quiz.user_answers = user_answers
            
            total_questions = len(quiz.questions)
            correct_count = 0

            for i, question in enumerate(quiz.questions):
                if i < len(user_answers):
                    user_ans = set(user_answers[i])
                    correct_ans = set(question.get('correct_answers', []))
                    if user_ans == correct_ans:
                        correct_count += 1

            quiz.score = (correct_count / total_questions) * 100 if total_questions > 0 else 0

        quiz.status = 'completed'
        quiz.save()

        serializer = QuizHistorySerializer(quiz)
        return Response({
            "message": "Quiz marked as completed.",
            **serializer.data
        }, status=status.HTTP_200_OK)
    except QuizHistory.DoesNotExist:
        return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_history(request):
    """
    Get all quiz history for a user (with optional domain/sub-domain filter)
    """
    domain = request.query_params.get('domain')
    sub_domain = request.query_params.get('sub_domain')

    quizzes = QuizHistory.objects.filter(user=request.user)

    if domain:
        quizzes = quizzes.filter(domain=domain)
    if sub_domain:
        quizzes = quizzes.filter(sub_domain=sub_domain)

    serializer = QuizHistorySerializer(quizzes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_quiz(request):
    """
    Resume an incomplete quiz based on domain and sub-domain
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
        "status": quiz.status
    }, status=status.HTTP_200_OK)
