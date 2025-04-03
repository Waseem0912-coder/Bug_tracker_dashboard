# api/serializers.py
from rest_framework import serializers
from .models import Bug
# Import User model, Group model, password validation
from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

class BugSerializer(serializers.ModelSerializer):
    """ Serializer for displaying Bug details. """
    status = serializers.CharField(source='get_status_display', read_only=True)
    priority = serializers.CharField(source='get_priority_display', read_only=True)
    status_key = serializers.CharField(source='status', read_only=True) # Expose internal key
    class Meta:
        model = Bug
        fields = [ 'id', 'bug_id', 'subject', 'description', 'status', 'status_key', 'priority', 'created_at', 'updated_at', 'modified_count', ]
        read_only_fields = [ 'id', 'bug_id', 'subject', 'description', 'priority', 'created_at', 'updated_at', 'modified_count' ]

class BugStatusUpdateSerializer(serializers.Serializer):
    """ Serializer for validating status updates via PATCH. """
    status = serializers.ChoiceField(choices=Bug.Status.choices, required=True)
    def validate_status(self, value):
        if not value: raise serializers.ValidationError("Status cannot be empty.")
        return value

class UserRegistrationSerializer(serializers.ModelSerializer):
    """ Serializer for handling new user registration. """
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True, required=True, label="Confirm Password")
    email = serializers.EmailField(required=True, max_length=254) # Standard max length

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'password': {'write_only': True, 'style': {'input_type': 'password'}, 'required': True, 'validators': [validate_password]}, # Apply Django validators
            'username': {'required': True},
        }

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email address already registered.")
        return value

    def validate(self, data):
        """ Check that password confirmation matches password. """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        # Password complexity is implicitly validated by 'validators' in extra_kwargs
        return data

    def create(self, validated_data):
        """ Create user and assign to 'Viewer' group. """
        validated_data.pop('password2') # Remove confirmation field
        user = User.objects.create_user(**validated_data) # Hashes password
        try:
            viewer_group = Group.objects.get(name='Viewer')
            user.groups.add(viewer_group)
            print(f"User {user.username} added to Viewer group.")
        except Group.DoesNotExist:
            print(f"WARNING: 'Viewer' group not found. User {user.username} created without default group.")
        return user