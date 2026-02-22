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
    SendOTPSerializer,
    VerifyOTPSerializer,
    SignupSerializer,
    CustomTokenObtainPairSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
)

from datetime import date, timedelta
from .models import UserActivity


# =========================
# 🔥 STREAK HELPER FUNCTION
# =========================
from user.models import UserActivity
from datetime import date

def mark_user_active(user):
    UserActivity.objects.get_or_create(
        user=user,
        date=date.today()
    )


# =========================
# 🔐 OTP APIs
# =========================
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def send_otp(request):
    serializer = SendOTPSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"detail": "OTP sent"})
    return Response(serializer.errors, status=400)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)
    if serializer.is_valid():
        return Response({"detail": "OTP verified"})
    return Response(serializer.errors, status=400)


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

    # 🔥 mark active on signup
    mark_user_active(user)

    return Response({"detail": "User created successfully."}, status=status.HTTP_201_CREATED)


# =========================
# 🔑 LOGIN
# =========================
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        username = request.data.get("username")

        user = (
            User.objects.filter(username__iexact=username).first()
            or User.objects.filter(email__iexact=username).first()
        )

        if user:
            mark_user_active(user)

        return response


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
# 🔥 STREAK API
# =========================
class StreakView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        activities = UserActivity.objects.filter(user=user).order_by('-date')

        # 🔥 calculate streak
        streak = 0
        current_day = today

        for activity in activities:
            if activity.date == current_day:
                streak += 1
                current_day -= timedelta(days=1)
            else:
                break

        # 🔥 last 7 days calendar
        last_7_days = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            active = UserActivity.objects.filter(user=user, date=day).exists()

            last_7_days.append({
                "date": str(day),
                "active": active
            })

        return Response({
            "streak": streak,
            "week": last_7_days
        })


# =========================
# 🔐 CHANGE PASSWORD
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