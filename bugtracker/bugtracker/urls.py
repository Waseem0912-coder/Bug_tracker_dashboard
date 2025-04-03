# bugtracker/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import ( TokenObtainPairView, TokenRefreshView, )

urlpatterns = [
    path('admin/', admin.site.urls),
    # API URLs (includes /api/register/)
    path('api/', include('api.urls', namespace='api')), # Add namespace if using it in api/urls.py
    # JWT Authentication URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]