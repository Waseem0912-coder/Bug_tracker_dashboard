# api/serializers.py
from rest_framework import serializers
from .models import Bug # Use .models since it's in the same app

class BugSerializer(serializers.ModelSerializer):
    """
    Serializer for the Bug model.
    """
    # Make choices human-readable in the API output
    status = serializers.CharField(source='get_status_display')
    priority = serializers.CharField(source='get_priority_display')

    class Meta:
        model = Bug
        fields = [
            'id', # Standard DRF primary key
            'bug_id',
            'subject',
            'description',
            'status',
            'priority',
            'created_at',
            'updated_at',
            'modified_count',
        ]
        # Optionally make some fields read-only if you were allowing API writes
        read_only_fields = ['created_at', 'updated_at', 'modified_count']