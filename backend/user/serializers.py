from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
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
        # optional: use django's password validators
        validate_password(data["password"], user=User(username=data.get("username")))
        return data

    def create(self, validated_data):
        validated_data.pop("password2", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)  # hashes password
        if not user.email:
            user.email = ""
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Accept username OR email in 'username' field.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # optionally add custom claims
        token["username"] = user.username
        return token

    def validate(self, attrs):
        # attrs includes 'username' and 'password' per default expectation
        username_or_email = attrs.get("username")
        password = attrs.get("password")
        # try to resolve email -> username
        from django.contrib.auth import authenticate
        from django.contrib.auth.models import User

        # If input looks like an email, try to resolve user
        if username_or_email and "@" in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                username = user_obj.username
            except User.DoesNotExist:
                username = username_or_email  # fallback to provided value
        else:
            username = username_or_email

        # Call parent validate but first set attrs["username"] to resolved username
        attrs["username"] = username
        return super().validate(attrs)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")
        read_only_fields = ("username", "email")  # change if you want to allow editing username/email


class ProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")

    def validate_email(self, value):
        if value:  # Only validate if email is provided
            user = self.context["request"].user
            if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError("Email is already in use.")
        return value

    def validate_username(self, value):
        if value:  # Only validate if username is provided
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
        validate_password(data["new_password"], user=self.context["request"].user)
        return data
