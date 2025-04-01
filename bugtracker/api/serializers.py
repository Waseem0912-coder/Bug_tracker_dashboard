from rest_framework import serializers
from .models import Bug, EmailLog 

class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = [
            'id',
            'received_at',
            'email_subject',
            'parsed_priority', 
            'parsed_status',
            'parsed_description',
            'parsed_assignee',
        ]
        read_only_fields = fields 


class BugSerializer(serializers.ModelSerializer):
    email_log_count = serializers.IntegerField(source='email_logs.count', read_only=True)
    email_logs = EmailLogSerializer(many=True, read_only=True, source='email_logs_ordered')


    class Meta:
        model = Bug
        fields = [
            'id',
            'unique_id',
            'latest_subject',
            'priority',
            'status',
            'description',
            'assignee',
            'created_at',
            'last_email_received_at',
            'last_manual_update_at',
            'email_log_count',
            'email_logs', 
        ]
        read_only_fields = [ 
            'id', 'unique_id', 'created_at', 'last_email_received_at',
            'last_manual_update_at', 'email_log_count', 'email_logs'
        ]
     