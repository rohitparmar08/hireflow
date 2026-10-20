from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.db import connection


class HealthCheckView(APIView):
    """
    Health check endpoint to verify backend operational readiness.
    Checks database connection and reports environment status.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request, *args, **kwargs):
        db_status = "healthy"
        try:
            connection.ensure_connection()
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"

        payload = {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "service": "HireFlow API",
            "version": "1.0.0",
            "debug_mode": settings.DEBUG,
            "database": db_status,
        }

        http_status = (
            status.HTTP_200_OK
            if db_status == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(payload, status=http_status)


class ApiRootView(APIView):
    """
    API v1 root providing navigational metadata for the HireFlow service.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request, *args, **kwargs):
        return Response({
            "message": "Welcome to the HireFlow API v1",
            "version": "1.0.0",
            "documentation": "/api/v1/docs/ (Phase 8)",
            "endpoints": {
                "health": request.build_absolute_uri("health/"),
                "auth": "/api/v1/auth/ (Phase 2)",
                "jobs": "/api/v1/jobs/ (Phase 3)",
                "applications": "/api/v1/applications/ (Phase 4)",
            },
        })
