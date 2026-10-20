from django.urls import path
from .views import (
    CurrentUserProfileView,
    LoginView,
    LogoutView,
    RefreshView,
    RegisterView,
    UpdateProfileView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserProfileView.as_view(), name="current_user"),
    path("profile/", UpdateProfileView.as_view(), name="update_profile"),
]
