from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # We can add custom fields here later if needed
    pass

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255, default='New Chat')

    def __str__(self):
        return f"Session for {self.user.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class ChatMessage(models.Model):
    SENDER_USER = 'user'
    SENDER_AI = 'ai'
    SENDER_CHOICES = [
        (SENDER_USER, 'User'),
        (SENDER_AI, 'AI'),
    ]
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=4, choices=SENDER_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} message in session {self.session.id}"

class UploadedFile(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename

class ModelSelection(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='model_selection')
    primary_model = models.CharField(max_length=100, default='llama3.1')
    vision_model = models.CharField(max_length=100, default='llava')
    embedding_model = models.CharField(max_length=100, default='nomic-embed-text')

    def __str__(self):
        return f"Model selection for {self.user.username}"