# chat/urls.py
from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # Page rendering URL
    path('', views.chat_page, name='chat_page'),

    # API Endpoints
    path('api/chat/message/', views.chat_message_api, name='chat_message_api'),
    path('api/chat/upload/', views.upload_file_api, name='upload_file_api'),
    path('api/chat/models/', views.get_models_api, name='get_models_api'),
    # We will add select-models later if needed; for now, selection is handled per-request.
]