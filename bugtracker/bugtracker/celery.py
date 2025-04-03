# bugtracker/celery.py
import os
from celery import Celery
from django.conf import settings # Import Django settings

# Set the default Django settings module for the 'celery' program.
# Replace 'bugtracker.settings' with your actual project settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bugtracker.settings')

# Create a Celery instance named 'bugtracker' (or your project name)
app = Celery('bugtracker')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix in settings.py.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
# Celery will automatically discover tasks defined in 'tasks.py' files
# within your installed apps (like 'api/tasks.py').
app.autodiscover_tasks()

# Optional: Example task for testing Celery setup
@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')