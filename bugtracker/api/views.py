# api/views.py
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework import generics, permissions, views, response, status
from rest_framework.pagination import PageNumberPagination # Import pagination

from .models import Bug, BugModificationLog
from .serializers import BugSerializer

# --- Custom Pagination (Optional - Define if you want non-default page size) ---
# class StandardResultsSetPagination(PageNumberPagination):
#     page_size = 20 # Or get from settings
#     page_size_query_param = 'page_size'
#     max_page_size = 100
# ----------------------------------------------------------------------------


class BugListView(generics.ListAPIView):
    """
    API endpoint that allows bugs to be viewed.
    Provides a list of all bugs with pagination.
    Requires authentication.
    """
    queryset = Bug.objects.all().order_by('-created_at') # Get all bugs, ordered
    serializer_class = BugSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can access
    # pagination_class = StandardResultsSetPagination # Uncomment to use custom pagination class
    # If not set, uses DEFAULT_PAGINATION_CLASS from settings

class BugDetailView(generics.RetrieveAPIView):
    """
    API endpoint that allows a single bug to be viewed.
    Retrieves bug details by its unique `bug_id`.
    Requires authentication.
    """
    queryset = Bug.objects.all()
    serializer_class = BugSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'bug_id' # Tell DRF to use 'bug_id' field from URL for lookup

class BugModificationsAPIView(views.APIView):
    """
    API endpoint to retrieve aggregated bug modification counts per date.
    Accepts an optional 'priority' query parameter ('low', 'medium', 'high').
    Returns data suitable for charting. Format: [{"date": "YYYY-MM-DD", "count": N}, ...]
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]
    valid_priorities = [p[0] for p in Bug.Priority.choices] # Get valid keys ('low', 'medium', 'high')

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve modification counts, filtered by priority if provided.
        """
        # Get priority filter from query parameters
        priority_filter = request.query_params.get('priority', None)

        # Validate the priority filter if provided
        if priority_filter and priority_filter.lower() not in self.valid_priorities:
            return response.Response(
                {"error": f"Invalid priority value. Choose from: {', '.join(self.valid_priorities)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Start with the base queryset
            queryset = BugModificationLog.objects.all()

            # Apply priority filter if specified
            if priority_filter:
                 # Filter based on the related bug's priority field
                 # Uses '__' to traverse the ForeignKey relationship
                queryset = queryset.filter(bug__priority=priority_filter.lower())
                print(f"Filtering modifications for priority: {priority_filter.lower()}") # Debug print

            # Perform aggregation on the (potentially filtered) queryset
            data = queryset \
                .annotate(date=TruncDate('modified_at')) \
                .values('date') \
                .annotate(count=Count('id')) \
                .values('date', 'count') \
                .order_by('date')

            # Format the date field
            formatted_data = [
                {
                    'date': item['date'].strftime('%Y-%m-%d') if item['date'] else None,
                    'count': item['count']
                }
                for item in data if item['date']
            ]

            return response.Response(formatted_data, status=status.HTTP_200_OK)

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching bug modifications (priority: {priority_filter}): {e}", exc_info=True)
            return response.Response(
                {"error": "An internal server error occurred while fetching modifications."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )