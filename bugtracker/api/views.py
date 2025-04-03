# api/views.py
import logging # For explicit logging
from django.db.models import Count, F # Import F object if modifying count in status update
from django.db.models.functions import TruncDate
from rest_framework import generics, permissions, views, response, status, filters # Import filters
from django.contrib.auth.models import User, Group # Import User, Group

from .models import Bug, BugModificationLog # Import models relative to app
# Import all serializers
from .serializers import BugSerializer, BugStatusUpdateSerializer, UserRegistrationSerializer

logger = logging.getLogger(__name__) # Get logger instance

# --- Custom Permission Classes for RBAC ---
class IsAdminUser(permissions.BasePermission):
    """ Allows access only to users in the 'Admin' group. """
    def has_permission(self, request, view):
        # Ensure user is authenticated before checking groups
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Admin').exists())

class IsDeveloperUser(permissions.BasePermission):
    """ Allows access only to users in the 'Developer' group. """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Developer').exists())

# Note: IsViewerUser is implicitly handled by IsAuthenticated for read-only views

# --- Views ---
class BugListView(generics.ListAPIView):
    """
    Lists all bugs, supports pagination and search.
    Accessible by any authenticated user.
    Search applies to bug_id, subject, and description fields.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Bug.objects.all().order_by('-created_at') # Base queryset
    serializer_class = BugSerializer

    # --- Add Search Filter ---
    filter_backends = [filters.SearchFilter]
    # Define fields to search against using the 'search' query parameter
    search_fields = ['bug_id', 'subject', 'description']
    # -------------------------

    # Pagination uses defaults from settings (including page_size_query_param)


class BugDetailView(generics.RetrieveAPIView):
    """ Retrieves details of a specific bug by bug_id. Accessible by any authenticated user. """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Bug.objects.all()
    serializer_class = BugSerializer
    lookup_field = 'bug_id' # Use the unique bug_id from the URL


class BugModificationsAPIView(views.APIView):
    """
    Retrieves aggregated modification counts per date.
    Accepts an optional 'priority' query parameter ('low', 'medium', 'high').
    Accessible by any authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    valid_priorities = [p[0] for p in Bug.Priority.choices] # Get ('low', 'medium', 'high')

    def get(self, request, *args, **kwargs):
        priority_filter = request.query_params.get('priority', None)

        # Validate priority filter
        if priority_filter and priority_filter.lower() not in self.valid_priorities:
            return response.Response(
                {"error": f"Invalid priority value. Choose from: {', '.join(self.valid_priorities)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            queryset = BugModificationLog.objects.select_related('bug').all() # Optimize query
            if priority_filter:
                 queryset = queryset.filter(bug__priority=priority_filter.lower())
                 logger.debug(f"Filtering modifications API for priority: {priority_filter.lower()}") # Use logger

            # Aggregate data
            data = queryset \
                .annotate(date=TruncDate('modified_at')) \
                .values('date') \
                .annotate(count=Count('id')) \
                .values('date', 'count') \
                .order_by('date')

            # Format response
            formatted_data = [{'date': item['date'].strftime('%Y-%m-%d'), 'count': item['count']} for item in data if item['date']]
            return response.Response(formatted_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching bug modifications (priority: {priority_filter}): {e}", exc_info=True) # Log full exception
            return response.Response({"error": "Server error fetching modifications data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BugStatusUpdateView(generics.UpdateAPIView):
    """
    Updates the status of a bug using PATCH. Requires Developer or Admin role.
    Expects JSON: { "status": "new_status_key" } (e.g., "in_progress")
    Returns the full updated Bug object via BugSerializer.
    """
    queryset = Bug.objects.all()
    serializer_class = BugStatusUpdateSerializer # Use this for input validation only
    lookup_field = 'bug_id'
    http_method_names = ['patch', 'options'] # Allow only PATCH for partial updates

    # Permissions: Must be logged in AND be in Developer OR Admin group
    permission_classes = [permissions.IsAuthenticated, (IsDeveloperUser | IsAdminUser)]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object() # Get the Bug instance using lookup_field
        # Validate incoming data { "status": "key" }
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) # Returns 400 on invalid choice/data

        new_status = serializer.validated_data.get('status')

        # Avoid DB write and signal if status isn't actually changing
        if instance.status == new_status:
            logger.debug(f"Status for bug {instance.bug_id} already set to '{new_status}'. No update needed.")
            return response.Response(BugSerializer(instance).data, status=status.HTTP_200_OK) # Return current data

        logger.info(f"Updating status for bug {instance.bug_id} from '{instance.status}' to '{new_status}' by user {request.user.username}.")
        instance.status = new_status
        # Note: As per spec, modified_count is NOT incremented on manual status change.
        # If this should change, add: instance.modified_count = F('modified_count') + 1
        # and potentially create a BugModificationLog entry.
        instance.save(update_fields=['status', 'updated_at']) # Save only updated fields

        # Return the FULL updated bug data using the main display serializer
        return response.Response(BugSerializer(instance).data, status=status.HTTP_200_OK)


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration. Assigns new user to 'Viewer' group.
    Accepts POST with username, email, password, password2.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny] # Anyone can access this endpoint
    serializer_class = UserRegistrationSerializer # Handles validation and creation

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
             serializer.is_valid(raise_exception=True) # Trigger validation
             user = self.perform_create(serializer) # Calls serializer.save() -> create()
        except serializers.ValidationError:
             logger.warning(f"Registration validation failed: {serializer.errors}")
             raise # Re-raise to let DRF handle 400 response
        except Exception as e:
             logger.error(f"Error during user registration: {e}", exc_info=True)
             return response.Response({"error": "An internal server error occurred during registration."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Customize success response - exclude password fields
        user_data = serializer.data
        user_data.pop('password', None); user_data.pop('password2', None)
        headers = self.get_success_headers(user_data) # Use user_data for headers
        logger.info(f"User '{user_data.get('username')}' registered successfully.")
        return response.Response(
            {"message": "Registration successful. Please log in.", "user": user_data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def perform_create(self, serializer):
        # DRF's default implementation just calls serializer.save()
        return serializer.save()