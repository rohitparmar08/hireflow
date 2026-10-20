"""
URL configuration for HireFlow project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.views import HealthCheckView

urlpatterns = [
    # Top-level health checks for cloud container orchestrators
    path("health/", HealthCheckView.as_view(), name="root-health"),
    path("healthz/", HealthCheckView.as_view(), name="root-healthz"),

    path("admin/", admin.site.urls),

    # Versioned API Endpoints
    path("api/v1/", include("apps.core.urls", namespace="core-v1")),
    path("api/v1/auth/", include("apps.accounts.urls", namespace="auth-v1")),
    path("api/v1/", include("apps.jobs.urls", namespace="jobs-v1")),
    path("api/v1/", include("apps.applications.urls", namespace="applications-v1")),
]

# Serve media files in local development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
