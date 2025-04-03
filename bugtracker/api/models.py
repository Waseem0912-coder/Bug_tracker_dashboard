# api/models.py
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.db.models import F

class Bug(models.Model):
    class Status(models.TextChoices): OPEN = 'open', _('Open'); IN_PROGRESS = 'in_progress', _('In Progress'); RESOLVED = 'resolved', _('Resolved'); CLOSED = 'closed', _('Closed')
    class Priority(models.TextChoices): LOW = 'low', _('Low'); MEDIUM = 'medium', _('Medium'); HIGH = 'high', _('High')
    bug_id = models.CharField(max_length=100, unique=True, db_index=True, help_text="Unique identifier (e.g., BUG-1234)")
    subject = models.CharField(max_length=255, help_text="Full subject line")
    description = models.TextField(help_text="Email body content")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    modified_count = models.IntegerField(default=0, help_text="Incremented on email updates")
    def __str__(self): return f"{self.bug_id}: {self.subject}"
    class Meta: ordering = ['-created_at']

class BugModificationLog(models.Model):
    bug = models.ForeignKey(Bug, on_delete=models.CASCADE, related_name='modification_logs')
    modified_at = models.DateTimeField(default=timezone.now, help_text="Timestamp of modification event")
    def __str__(self): return f"Mod for {self.bug.bug_id} at {self.modified_at}"
    class Meta: ordering = ['-modified_at']

class ProcessedEmail(models.Model):
    message_id = models.CharField(max_length=500, unique=True, db_index=True, help_text="Unique Message-ID header")
    processed_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.message_id
    class Meta: verbose_name = "Processed Email Record"; verbose_name_plural = "Processed Email Records"; ordering = ['-processed_at']