"""
URL configuration for HireFlow project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    # Versioned API Root
    path("api/v1/", include("apps.core.urls", namespace="core-v1")),
]

# Serve media files in local development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
