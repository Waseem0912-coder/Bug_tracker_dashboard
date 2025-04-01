from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from django.core.management import call_command
from io import StringIO 
import threading 
import sys
from .models import Bug
from .serializers import BugSerializer

class BugViewSet(viewsets.ModelViewSet):

    queryset = Bug.objects.prefetch_related('email_logs').order_by('-last_email_received_at', '-created_at')
    serializer_class = BugSerializer
    permission_classes = [permissions.AllowAny] # TODO: Secure
    lookup_field = 'unique_id'
    http_method_names = ['get', 'patch', 'head', 'options']

class TriggerEmailCheckView(views.APIView):

    permission_classes = [permissions.AllowAny] # TODO: Secure this endpoint!

    def post(self, request, *args, **kwargs):
        self.log_message("Received trigger request.")

        try:
            # output = StringIO()
            # call_command('check_emails', stdout=output, stderr=output)
            # result = output.getvalue()
            # self.log_message(f"Command finished:\n{result}")
            # return Response({"message": "Email check command executed.", "output": result}, status=status.HTTP_200_OK)
            thread = threading.Thread(target=self.run_check_emails_command)
            thread.start()
            self.log_message("Started check_emails command in background thread.")
            return Response({"message": "Email check initiated in background."}, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            self.log_message(f"Error triggering command: {e}", error=True)
            return Response({"error": f"Failed to trigger email check: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def run_check_emails_command(self):
        """Runs the command and logs output."""
        self.log_message("Background thread: Executing check_emails...")
        output = StringIO()
        try:
            call_command('check_emails', stdout=output, stderr=output)
            result = output.getvalue()
            self.log_message(f"Background thread: Command finished successfully.\nOutput:\n{result}")
        except Exception as e:
            result = output.getvalue()
            self.log_message(f"Background thread: Command failed!\nOutput:\n{result}\nError:\n{e}", error=True)
            import traceback
            self.log_message(traceback.format_exc(), error=True)


    def log_message(self, message, error=False):
         prefix = "[TriggerEmailCheck]"
         if error:
             print(f"{prefix} ERROR: {message}", file=sys.stderr)
         else:
             print(f"{prefix} INFO: {message}")