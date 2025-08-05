# templates_manager/admin.py
from django.contrib import admin
from .models import ReportTemplate, TemplateField, UserTemplate

class TemplateFieldInline(admin.TabularInline):
    """Allows editing TemplateFields directly within the ReportTemplate admin page."""
    model = TemplateField
    extra = 1  # How many extra empty forms to show

@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_global')
    search_fields = ('name', 'description')
    inlines = [TemplateFieldInline]

@admin.register(UserTemplate)
class UserTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'base_template', 'created_at')
    list_filter = ('user',)
    search_fields = ('name',)