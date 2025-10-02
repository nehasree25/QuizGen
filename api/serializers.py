# quizzes/serializers.py
from rest_framework import serializers

class QuizGenerationSerializer(serializers.Serializer):
    """
    Serializer for generating quiz in your exact format:
    {'domain': 'python', 'sub-domain': 'list', 'number_of_questions': 10, 'level': 'easy'}
    """
    domain = serializers.CharField(max_length=100)
    sub_domain = serializers.CharField(max_length=100)
    number_of_questions = serializers.IntegerField(min_value=1, max_value=20, default=10)
    level = serializers.ChoiceField(
        choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')]
    )