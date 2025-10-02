
from django.urls import path
from api.swagger import schema_view
from .views import generate_quiz

urlpatterns = [
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('generate-quiz/', generate_quiz, name='generate-quiz'),
]