from django.urls import path
from .views import (
    signup_view,
    CustomTokenObtainPairView,
    logout_view,
    ProfileView,
    ProfileEditView,
    ChangePasswordView,
    send_otp,          # ✅ ADD THIS
    verify_otp 
)
from rest_framework_simplejwt.views import TokenRefreshView
from .views import StreakView
urlpatterns = [
    path("auth/signup/", signup_view, name="signup"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("auth/profile/edit/", ProfileEditView.as_view(), name="profile-edit"),
    path("auth/send-otp/", send_otp),
    path("auth/verify-otp/", verify_otp),
    path("streak/", StreakView.as_view()),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
]
