from django.db import models
from chat.models import User

class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ReportVersion(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    content_snapshot = models.TextField()
    edit_reason = models.CharField(max_length=500, default='New version')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('report', 'version_number')

    def __str__(self):
        return f"{self.report.title} - Version {self.version_number}"

class ReportChart(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='charts')
    chart_title = models.CharField(max_length=255)
    chart_type = models.CharField(max_length=50) # e.g., 'bar', 'line', 'pie'
    chart_html = models.TextField() # To store Plotly's HTML output
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.chart_title

class ExportHistory(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='exports')
    export_format = models.CharField(max_length=10) # 'PDF', 'DOCX', 'HTML'
    exported_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"'{self.report.title}' exported as {self.export_format}"