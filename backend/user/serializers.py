from django.contrib.auth.models import User
from django.contrib.auth.password_validation import get_default_password_validators
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "first_name", "last_name")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # Get all default validators except UserAttributeSimilarityValidator
        validators = [
            v for v in get_default_password_validators()
            if v.__class__.__name__ != "UserAttributeSimilarityValidator"
        ]

        # Run filtered validators manually
        for validator in validators:
            try:
                validator.validate(data["password"], user=User(username=data.get("username")))
            except ValidationError as e:
                raise serializers.ValidationError({"password": list(e.messages)})

        return data

    def create(self, validated_data):
        validated_data.pop("password2", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        if not user.email:
            user.email = ""
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allows login using username OR email"""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token

    def validate(self, attrs):
        from django.contrib.auth import authenticate, get_user_model
        User = get_user_model()

        username_or_email = attrs.get("username")
        password = attrs.get("password")

        # Try username or email
        user = (
            User.objects.filter(username__iexact=username_or_email).first()
            or User.objects.filter(email__iexact=username_or_email).first()
        )

        if not user:
            raise serializers.ValidationError({"detail": "No username or email found."})

        user_auth = authenticate(username=user.username, password=password)
        if not user_auth:
            raise serializers.ValidationError({"detail": "Incorrect password."})

        attrs["username"] = user.username
        return super().validate(attrs)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")
        read_only_fields = ("username", "email")


class ProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")

    def validate_email(self, value):
        if value:
            user = self.context["request"].user
            if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError("Email is already in use.")
        return value

    def validate_username(self, value):
        if value:
            user = self.context["request"].user
            if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError("Username is already in use.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError({"new_password": "New passwords do not match."})

        # Get all validators except similarity
        validators = [
            v for v in get_default_password_validators()
            if v.__class__.__name__ != "UserAttributeSimilarityValidator"
        ]

        # Run filtered validators manually
        for validator in validators:
            try:
                validator.validate(data["new_password"], user=self.context["request"].user)
            except ValidationError as e:
                raise serializers.ValidationError({"new_password": list(e.messages)})

        return data
