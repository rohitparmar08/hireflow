from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Role

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for public user registration.
    Enforces strong password validation and restricts role to RECRUITER or CANDIDATE.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    role = serializers.ChoiceField(
        choices=Role.choices,
        required=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "password",
            "password_confirm",
            "company_name",
            "phone_number",
            "headline",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate_first_name(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("First name cannot be blank.")
        return stripped

    def validate_last_name(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("Last name cannot be blank.")
        return stripped

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        # Validate password strength against Django's AUTH_PASSWORD_VALIDATORS
        validate_password(password)

        # Enforce company name for recruiters
        if attrs.get("role") == Role.RECRUITER and not attrs.get("company_name", "").strip():
            raise serializers.ValidationError({"company_name": "Company name is required for recruiters."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        # Ensure staff/superuser flags can never be set via public registration
        validated_data["is_staff"] = False
        validated_data["is_superuser"] = False

        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Public representation of the authenticated user's profile.
    """

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "company_name",
            "phone_number",
            "headline",
            "bio",
            "date_joined",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "full_name",
            "date_joined",
            "updated_at",
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating personal profile details.
    Strictly forbids role escalation or email alteration.
    """

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "company_name",
            "phone_number",
            "headline",
            "bio",
        ]

    def validate(self, attrs):
        # Explicit safeguard against malicious payload injections
        for forbidden in ["role", "email", "is_staff", "is_superuser"]:
            if forbidden in self.initial_data and self.initial_data[forbidden] != getattr(self.instance, forbidden, None):
                raise serializers.ValidationError({forbidden: f"Modifying '{forbidden}' is not permitted."})
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer injecting user profile data into the login response
    and embedding role/name claims inside the token payload.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims embedded in token
        token["email"] = user.email
        token["role"] = user.role
        token["full_name"] = user.get_full_name()
        return token

    def validate(self, attrs):
        # Case-insensitive email lookup
        email = attrs.get("email", "").strip().lower()
        attrs["email"] = email
        data = super().validate(attrs)

        # Append user metadata directly to the login response payload
        data["user"] = UserSerializer(self.user).data
        return data
