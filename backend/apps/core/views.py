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
                "auth": {
                    "register": request.build_absolute_uri("auth/register/"),
                    "login": request.build_absolute_uri("auth/login/"),
                    "refresh": request.build_absolute_uri("auth/refresh/"),
                    "logout": request.build_absolute_uri("auth/logout/"),
                    "me": request.build_absolute_uri("auth/me/"),
                    "profile": request.build_absolute_uri("auth/profile/"),
                },
                "jobs": {
                    "public_list": request.build_absolute_uri("jobs/"),
                    "recruiter_jobs": request.build_absolute_uri("recruiter/jobs/"),
                },
                "applications": {
                    "candidate_applications": request.build_absolute_uri("candidate/applications/"),
                    "job_apply_template": request.build_absolute_uri("jobs/{id}/apply/"),
                    "job_applicants_template": request.build_absolute_uri("jobs/{id}/applications/"),
                    "application_detail_template": request.build_absolute_uri("applications/{id}/"),
                    "match_analysis_template": request.build_absolute_uri("applications/{id}/match/"),
                    "resume_download_template": request.build_absolute_uri("applications/{id}/resume/"),
                },

            },
        })
