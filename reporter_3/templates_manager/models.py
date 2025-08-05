from django.db import models
from chat.models import User

class ReportTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    content_structure = models.JSONField(default=dict) # e.g., {"Introduction": "", "Analysis": ""}
    is_global = models.BooleanField(default=True) # Global vs. user-specific

    def __str__(self):
        return self.name

class TemplateField(models.Model):
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='fields')
    field_name = models.CharField(max_length=100)
    placeholder = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.field_name} in {self.template.name}"

class UserTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_templates')
    base_template = models.ForeignKey(ReportTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    content_structure = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Custom template '{self.name}' for {self.user.username}"