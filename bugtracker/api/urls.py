# api/urls.py
from django.urls import path
from . import views # Use relative import within the same app

app_name = 'api' # Namespace for URLs (optional but good practice)

urlpatterns = [
    path('bugs/', views.BugListView.as_view(), name='bug-list'),
    path('bugs/<str:bug_id>/', views.BugDetailView.as_view(), name='bug-detail'),
    path('bug_modifications/', views.BugModificationsAPIView.as_view(), name='bug-modifications'),
]