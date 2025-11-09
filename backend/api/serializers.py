from rest_framework import serializers
from .models import QuizHistory

class QuizGenerationSerializer(serializers.Serializer):
    domain = serializers.CharField(max_length=100)
    sub_domain = serializers.CharField(max_length=100)
    number_of_questions = serializers.IntegerField(min_value=1, max_value=20, default=10)
    level = serializers.ChoiceField(
        choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')]
    )

class GeneratedQuestionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    question = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    correct_answers = serializers.ListField(child=serializers.CharField())
    explanation = serializers.CharField()

class QuizHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizHistory
        fields = [
            'id', 'user', 'domain', 'sub_domain',
            'questions', 'user_answers', 'current_question_index',
            'score', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user']

class ResumeQuizSerializer(serializers.Serializer):
    domain = serializers.CharField(max_length=100)
    sub_domain = serializers.CharField(max_length=100)
