# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BugViewSet, TriggerEmailCheckView 

router = DefaultRouter()
router.register(r'bugs', BugViewSet, basename='bug')

urlpatterns = [
    path('', include(router.urls)),
    path('trigger-email-check/', TriggerEmailCheckView.as_view(), name='trigger-email-check'),
]