# bugtracker/urls.py
from django.contrib import admin
from django.urls import path, include # Import include
from rest_framework_simplejwt.views import ( # Import JWT views
    TokenObtainPairView,
    TokenRefreshView,
    # TokenVerifyView, # Optional: if you want an endpoint to verify token validity
    # TokenBlacklistView # Optional: if you need manual blacklisting endpoint
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API URLs
    path('api/', include('api.urls')), # Include your app's URLs under '/api/' prefix

    # JWT Authentication URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'), # Optional
    # path('api/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'), # Optional
]