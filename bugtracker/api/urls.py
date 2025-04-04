from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [

    path('bugs/', views.BugListView.as_view(), name='bug-list'),
    path('bugs/<str:bug_id>/', views.BugDetailView.as_view(), name='bug-detail'),
    path('bugs/<str:bug_id>/status/', views.BugStatusUpdateView.as_view(), name='bug-status-update'),
    path('bug_modifications/', views.BugModificationsAPIView.as_view(), name='bug-modifications'),
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
]