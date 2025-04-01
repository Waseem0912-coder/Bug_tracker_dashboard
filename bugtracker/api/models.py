from django.db import models
from django.utils import timezone 

class Bug(models.Model):
    PRIORITY_CHOICES = [ 
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    unique_id = models.CharField(max_length=100, unique=True, db_index=True,
                                 help_text="The unique identifier extracted from the email subject.")
    latest_subject = models.CharField(max_length=255, blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    description = models.TextField(blank=True, null=True)
    assignee = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True) 
    last_email_received_at = models.DateTimeField(null=True, blank=True) 
    last_manual_update_at = models.DateTimeField(auto_now=True)

    @property
    def email_logs_ordered(self):
         return self.email_logs.order_by('-received_at')

    def __str__(self):
        return f"{self.unique_id} - {self.latest_subject or 'No Subject Yet'}"

    class Meta:
        ordering = ['-last_email_received_at', '-created_at']

class EmailLog(models.Model):
    """Stores the details parsed from each individual email received."""
    bug = models.ForeignKey(Bug, on_delete=models.CASCADE, related_name='email_logs')
    received_at = models.DateTimeField(default=timezone.now) 
    email_subject = models.CharField(max_length=255)
    parsed_priority = models.CharField(max_length=50, blank=True, null=True) 
    parsed_status = models.CharField(max_length=50, blank=True, null=True)
    parsed_description = models.TextField(blank=True, null=True)
    parsed_assignee = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Log for {self.bug.unique_id} at {self.received_at.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-received_at']
