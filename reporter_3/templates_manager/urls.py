# templates_manager/urls.py
from django.urls import path
from . import views

app_name = 'templates_manager'

urlpatterns = [
    path('api/templates/', views.get_templates_api, name='get_templates_api'),
]