from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class QuizHistory(models.Model):
    STATUS_CHOICES = [
        ('incomplete', 'Incomplete'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    domain = models.CharField(max_length=100)
    sub_domain = models.CharField(max_length=100)
    questions = models.JSONField()
    user_answers = models.JSONField(default=list, blank=True)
    current_question_index = models.IntegerField(default=0)
    score = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='incomplete')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.domain}/{self.sub_domain} ({self.status})"
