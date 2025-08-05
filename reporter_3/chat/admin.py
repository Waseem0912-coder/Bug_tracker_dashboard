# chat/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ChatSession, ChatMessage, UploadedFile, ModelSelection

class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('sender', 'message', 'created_at')

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'created_at')
    search_fields = ('title', 'user__username')
    inlines = [ChatMessageInline]

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # You can add custom fields here later
    pass

@admin.register(ModelSelection)
class ModelSelectionAdmin(admin.ModelAdmin):
    list_display = ('user', 'primary_model', 'vision_model', 'embedding_model')

@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ('filename', 'session', 'uploaded_at')