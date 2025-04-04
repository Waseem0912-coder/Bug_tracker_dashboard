from django.contrib import admin
from .models import Bug, BugModificationLog, ProcessedEmail 

@admin.register(Bug)
class BugAdmin(admin.ModelAdmin):
    list_display = ('bug_id', 'subject', 'status', 'priority', 'modified_count', 'created_at', 'updated_at')
    list_filter = ('status', 'priority', 'created_at', 'updated_at')
    search_fields = ('bug_id', 'subject', 'description')
    readonly_fields = ('created_at', 'updated_at', 'modified_count')
    ordering = ('-created_at',)

@admin.register(BugModificationLog)
class BugModificationLogAdmin(admin.ModelAdmin):
    list_display = ('bug', 'modified_at')
    list_filter = ('modified_at',)
    search_fields = ('bug__bug_id', 'bug__subject')
    autocomplete_fields = ['bug']
    ordering = ('-modified_at',)

@admin.register(ProcessedEmail)
class ProcessedEmailAdmin(admin.ModelAdmin):
    list_display = ('message_id', 'processed_at')
    search_fields = ('message_id',)
    ordering = ('-processed_at',)