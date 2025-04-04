import logging 
from django.db.models import Count, F 
from django.db.models.functions import TruncDate
from rest_framework import generics, permissions, views, response, status, filters 
from django.contrib.auth.models import User, Group 

from .models import Bug, BugModificationLog 

from .serializers import BugSerializer, BugStatusUpdateSerializer, UserRegistrationSerializer

logger = logging.getLogger(__name__) 

class IsAdminUser(permissions.BasePermission):
    """ Allows access only to users in the 'Admin' group. """
    def has_permission(self, request, view):

        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Admin').exists())

class IsDeveloperUser(permissions.BasePermission):
    """ Allows access only to users in the 'Developer' group. """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Developer').exists())

class BugListView(generics.ListAPIView):
    """
    Lists all bugs, supports pagination and search.
    Accessible by any authenticated user.
    Search applies to bug_id, subject, and description fields.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Bug.objects.all().order_by('-created_at') 
    serializer_class = BugSerializer

    filter_backends = [filters.SearchFilter]

    search_fields = ['bug_id', 'subject', 'description']

class BugDetailView(generics.RetrieveAPIView):
    """ Retrieves details of a specific bug by bug_id. Accessible by any authenticated user. """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Bug.objects.all()
    serializer_class = BugSerializer
    lookup_field = 'bug_id' 

class BugModificationsAPIView(views.APIView):
    """
    Retrieves aggregated modification counts per date.
    Accepts an optional 'priority' query parameter ('low', 'medium', 'high').
    Accessible by any authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    valid_priorities = [p[0] for p in Bug.Priority.choices] 

    def get(self, request, *args, **kwargs):
        priority_filter = request.query_params.get('priority', None)

        if priority_filter and priority_filter.lower() not in self.valid_priorities:
            return response.Response(
                {"error": f"Invalid priority value. Choose from: {', '.join(self.valid_priorities)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            queryset = BugModificationLog.objects.select_related('bug').all() 
            if priority_filter:
                 queryset = queryset.filter(bug__priority=priority_filter.lower())
                 logger.debug(f"Filtering modifications API for priority: {priority_filter.lower()}") 

            data = queryset \
                .annotate(date=TruncDate('modified_at')) \
                .values('date') \
                .annotate(count=Count('id')) \
                .values('date', 'count') \
                .order_by('date')

            formatted_data = [{'date': item['date'].strftime('%Y-%m-%d'), 'count': item['count']} for item in data if item['date']]
            return response.Response(formatted_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching bug modifications (priority: {priority_filter}): {e}", exc_info=True) 
            return response.Response({"error": "Server error fetching modifications data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BugStatusUpdateView(generics.UpdateAPIView):
    """
    Updates the status of a bug using PATCH. Requires Developer or Admin role.
    Expects JSON: { "status": "new_status_key" } (e.g., "in_progress")
    Returns the full updated Bug object via BugSerializer.
    """
    queryset = Bug.objects.all()
    serializer_class = BugStatusUpdateSerializer 
    lookup_field = 'bug_id'
    http_method_names = ['patch', 'options'] 

    permission_classes = [permissions.IsAuthenticated, (IsDeveloperUser | IsAdminUser)]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object() 

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) 

        new_status = serializer.validated_data.get('status')

        if instance.status == new_status:
            logger.debug(f"Status for bug {instance.bug_id} already set to '{new_status}'. No update needed.")
            return response.Response(BugSerializer(instance).data, status=status.HTTP_200_OK) 

        logger.info(f"Updating status for bug {instance.bug_id} from '{instance.status}' to '{new_status}' by user {request.user.username}.")
        instance.status = new_status

        instance.save(update_fields=['status', 'updated_at']) 

        return response.Response(BugSerializer(instance).data, status=status.HTTP_200_OK)

class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration. Assigns new user to 'Viewer' group.
    Accepts POST with username, email, password, password2.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny] 
    serializer_class = UserRegistrationSerializer 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
             serializer.is_valid(raise_exception=True) 
             user = self.perform_create(serializer) 
        except serializers.ValidationError:
             logger.warning(f"Registration validation failed: {serializer.errors}")
             raise 
        except Exception as e:
             logger.error(f"Error during user registration: {e}", exc_info=True)
             return response.Response({"error": "An internal server error occurred during registration."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user_data = serializer.data
        user_data.pop('password', None); user_data.pop('password2', None)
        headers = self.get_success_headers(user_data) 
        logger.info(f"User '{user_data.get('username')}' registered successfully.")
        return response.Response(
            {"message": "Registration successful. Please log in.", "user": user_data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def perform_create(self, serializer):

        return serializer.save()