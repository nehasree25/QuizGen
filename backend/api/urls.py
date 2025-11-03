from django.urls import path
from .views import generate_quiz, get_quiz_history, resume_quiz, mark_quiz_complete
from api.swagger import schema_view

urlpatterns = [
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('generate-quiz/', generate_quiz, name='generate-quiz'),
    path('quiz-history/', get_quiz_history, name='quiz-history'),
    path('resume-quiz/', resume_quiz, name='resume-quiz'),
    path('mark-complete/<int:quiz_id>/', mark_quiz_complete, name='mark-complete'),
]
