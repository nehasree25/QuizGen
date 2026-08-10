from django.contrib.auth import authenticate
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    SignupSerializer,
    CustomTokenObtainPairSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
)


# OTP endpoints removed


# =========================
# 👤 SIGNUP
# =========================
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def signup_view(request):
    serializer = SignupSerializer(
        data=request.data,
        context={"request": request}
    )

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    return Response({"detail": "User created successfully."}, status=status.HTTP_201_CREATED)


# =========================
# 🔑 LOGIN
# =========================
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Debug logging to help diagnose 400 Bad Request from frontend
        try:
            print('--- Login request headers ---')
            for k, v in request.headers.items():
                print(f'{k}: {v}')
            print('--- Login request body (raw) ---')
            try:
                print(request.body.decode('utf-8'))
            except Exception:
                print(request.body)
            print('--- Login request.data parsed ---')
            print(request.data)
        except Exception as e:
            print('Error logging login request:', e)

        # Run serializer manually to capture validation errors
        serializer = self.get_serializer(data=request.data)

        # Extra debug: check user existence and password check
        try:
            from django.contrib.auth import get_user_model
            UserModel = get_user_model()
            username_or_email = request.data.get('username')
            user_obj = (
                UserModel.objects.filter(username__iexact=username_or_email).first()
                or UserModel.objects.filter(email__iexact=username_or_email).first()
            )
            print('--- User lookup ---')
            if user_obj:
                print('Found user:', user_obj.username, 'email:', user_obj.email)
                try:
                    print('is_active:', user_obj.is_active)
                    print('password hash (starts):', str(user_obj.password)[:10])
                    pw = request.data.get('password')
                    print('check_password result:', user_obj.check_password(pw))
                except Exception as e:
                    print('Error checking password:', e)
            else:
                print('User not found for:', username_or_email)
        except Exception as e:
            print('Error in extra user debug:', e)
        if not serializer.is_valid():
            print('--- Login serializer errors ---')
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # If valid, return tokens as normal
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


# =========================
# 🚪 LOGOUT
# =========================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
    except KeyError:
        return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =========================
# 👤 PROFILE
# =========================
class ProfileView(RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user


class ProfileEditView(RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileUpdateSerializer

    def get_object(self):
        return self.request.user


# =========================
#  CHANGE PASSWORD
# =========================
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)