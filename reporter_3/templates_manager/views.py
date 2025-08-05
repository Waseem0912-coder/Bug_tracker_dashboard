# templates_manager/views.py
from django.http import JsonResponse
from .models import ReportTemplate

def get_templates_api(request):
    """
    API endpoint to list all available report templates.
    """
    if request.method == 'GET':
        templates = ReportTemplate.objects.filter(is_global=True).values('name', 'description')
        return JsonResponse(list(templates), safe=False)
    return JsonResponse({'error': 'Invalid request method'}, status=405)