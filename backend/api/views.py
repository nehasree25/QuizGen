from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import QuizGenerationSerializer
from .services import AIService

@swagger_auto_schema(
    method='post',
    operation_description="Generate quiz questions using AI (supports multiple correct answers)",
    request_body=QuizGenerationSerializer,
    responses={
        200: openapi.Response(
            description="Successfully generated quiz questions",
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'question': openapi.Schema(type=openapi.TYPE_STRING),
                        'options': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING)
                        ),
                        'correct_answers': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING)
                        ),
                        'explanation': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            )
        ),
        400: openapi.Response(
            description="Bad Request - Invalid parameters",
            examples={
                "application/json": {
                    "domain": ["This field is required."],
                    "sub_domain": ["This field is required."]
                }
            }
        ),
        500: openapi.Response(
            description="Internal Server Error",
            examples={
                "application/json": {
                    "error": "API request failed"
                }
            }
        )
    }
)
@api_view(['POST'])
def generate_quiz(request):
    """
    Generate quiz using Gemini 2.0 Flash (multiple correct answers)
    Returns ONLY the questions array
    """
    serializer = QuizGenerationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    ai_service = AIService()
    result = ai_service.generate_quiz_questions(
        domain=data['domain'],
        sub_domain=data['sub_domain'],
        number_of_questions=data['number_of_questions'],
        level=data['level']
    )

    if isinstance(result, dict) and 'error' in result:
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(result, status=status.HTTP_200_OK)
