# reports/urls.py
from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    # We can add more endpoints here as specified in the plan later on
    # path('api/reports/<int:report_id>/edit/', views.edit_report_api, name='edit_report_api'),
]