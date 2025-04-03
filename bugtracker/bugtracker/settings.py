# bugtracker/settings.py

import os
from pathlib import Path
from dotenv import load_dotenv
import datetime # Make sure to import datetime

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file (Recommended!)
load_dotenv(BASE_DIR / '.env') # Looks for .env in the project root

# Quick-start development settings - unsuitable for production 
# # SECURITY WARNING: keep the secret key used in production secret!
# Recommend moving this to .env
# settings.py
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'some-default-fallback-key-if-env-missing')
# SECURITY WARNING: don't run with debug turned on in production!
# Recommend moving this to .env
DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True'

# Recommend moving this to .env or configuring properly for production
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist', # For JWT refresh token blacklisting
    'corsheaders',
    'django_celery_beat',      # For scheduling tasks
    'django_celery_results', # To store task results (optional but good)

    # Your apps
    'api.apps.ApiConfig', # Use your app's config class
]

# bugtracker/settings.py

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', # If using sessions
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'bugtracker.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bugtracker.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
# Currently using SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
# --- Example PostgreSQL configuration using .env (if you switch later) ---
# DB_NAME = os.getenv('DB_NAME', 'bugtracker_db')
# DB_USER = os.getenv('DB_USER', 'bugtracker_user')
# DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
# DB_HOST = os.getenv('DB_HOST', 'localhost')
# DB_PORT = os.getenv('DB_PORT', '5432')
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': DB_NAME,
#         'USER': DB_USER,
#         'PASSWORD': DB_PASSWORD,
#         'HOST': DB_HOST,
#         'PORT': DB_PORT,
#     }
# }
# ---------------------------------------------------------------------


# Password validation
# # https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    # ... (keep your existing validators) ...
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
# Add STATIC_ROOT for collectstatic if needed for production deployment later
# STATIC_ROOT = BASE_DIR / 'staticfiles'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,  # Default page size
    # --- ADD THIS ---
    'PAGE_SIZE_QUERY_PARAM': 'page_size', # Allows frontend to override page size
    'MAX_PAGE_SIZE': 100 # Optional: Set a maximum limit
    # --------------
}

# Simple JWT Settings
SIMPLE_JWT = {
    # Recommend adjusting lifetimes for production
    'ACCESS_TOKEN_LIFETIME': datetime.timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': datetime.timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,        # Issues a new refresh token when refreshing
    'BLACKLIST_AFTER_ROTATION': True, # Blacklists the old refresh token after rotation
    'UPDATE_LAST_LOGIN': True,          # Updates user's last_login field on token refresh

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY, # Uses Django's SECRET_KEY
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    # Settings below are usually for sliding tokens, less relevant for paired tokens
    # 'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    # 'SLIDING_TOKEN_LIFETIME': datetime.timedelta(minutes=5),
    # 'SLIDING_TOKEN_REFRESH_LIFETIME': datetime.timedelta(days=1),
}


# CORS Settings
# Your existing settings are good for local dev with React on port 3000
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Add other origins if deploying frontend elsewhere
# Or get from .env:
# CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')

# Allow cookies to be sent with CORS requests (needed for HttpOnly cookies, maybe JWT later)
CORS_ALLOW_CREDENTIALS = True


# Email Settings (For IMAP - MUST set these in .env or here)
IMAP_SERVER = os.getenv('IMAP_SERVER')
IMAP_PORT = int(os.getenv('IMAP_PORT', 993))
IMAP_USER = os.getenv('IMAP_USER')
IMAP_PASSWORD = os.getenv('IMAP_PASSWORD')


# Celery Configuration (using Redis)
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0') # Using Redis for results too
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE # Use Django's timezone
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler' # Use DB scheduler for beat


# Logging Configuration (Example)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': { # Add formatters for better log messages
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple', # Use the simple formatter
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO', # Root logger level
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False, # Prevent django logs from going to root
        },
        'api': { # Logger for YOUR app
            'handlers': ['console'],
            'level': 'DEBUG', # More detail for your app during dev
            'propagate': False,
        },
         'celery': { # Logger for Celery
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# --- Add/Ensure these exist ---
CORS_ALLOW_METHODS = [  # Explicitly list allowed methods
    "DELETE",
    "GET",
    "OPTIONS", # Must include OPTIONS for preflight
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [  # Explicitly list allowed headers
    "accept",
    "accept-encoding",
    "authorization", # Crucial for JWT Bearer token
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]