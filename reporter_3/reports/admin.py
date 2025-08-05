# reports/admin.py
from django.contrib import admin
from .models import Report, ReportVersion, ReportChart, ExportHistory

class ReportVersionInline(admin.TabularInline):
    model = ReportVersion
    extra = 0
    readonly_fields = ('created_at', 'version_number', 'edit_reason')
    can_delete = False

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'last_modified', 'created_at')
    search_fields = ('title', 'user__username')
    list_filter = ('user',)
    inlines = [ReportVersionInline]

@admin.register(ExportHistory)
class ExportHistoryAdmin(admin.ModelAdmin):
    list_display = ('report', 'user', 'export_format', 'exported_at')
    list_filter = ('export_format', 'user')