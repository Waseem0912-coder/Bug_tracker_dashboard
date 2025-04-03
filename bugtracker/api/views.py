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
    Returns data suitable for charting. Format: [{"date": "YYYY-MM-DD", "count": N}, ...]
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve modification counts.
        """
        try:
            # Query the BugModificationLog table
            data = BugModificationLog.objects \
                .annotate(date=TruncDate('modified_at')) \
                .values('date') \
                .annotate(count=Count('id')) \
                .values('date', 'count') \
                .order_by('date') # Order chronologically

            # Format the date field as string 'YYYY-MM-DD'
            # (Note: .values() might already return strings depending on DB backend,
            # but explicit formatting ensures consistency)
            formatted_data = [
                {
                    'date': item['date'].strftime('%Y-%m-%d') if item['date'] else None, # Handle potential None dates
                    'count': item['count']
                }
                for item in data if item['date'] # Filter out potential null dates if necessary
            ]

            return response.Response(formatted_data, status=status.HTTP_200_OK)

        except Exception as e:
            # Log the error (using Django's logging)
            import logging
            logger = logging.getLogger(__name__) # Or use logger = logging.getLogger('api') based on settings
            logger.error(f"Error fetching bug modifications: {e}", exc_info=True)
            return response.Response(
                {"error": "An internal server error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )