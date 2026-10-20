from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsRecruiter
from apps.jobs.models import JobPosting
from apps.jobs.pagination import StandardResultsSetPagination
from .models import Application, ApplicationStatus
from .permissions import IsCandidate, IsApplicationParticipant
from .serializers import (
    ApplicationDetailSerializer,
    ApplicationListSerializer,
    ApplicationStatusUpdateSerializer,
    ApplicationSubmissionSerializer,
)


class JobApplicationSubmitView(APIView):
    """
    POST /api/v1/jobs/{id}/apply/ — Candidate submits resume and application for an active job.
    """

    permission_classes = [IsAuthenticated, IsCandidate]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, id, *args, **kwargs):
        job = get_object_or_404(JobPosting, id=id)

        serializer = ApplicationSubmissionSerializer(
            data=request.data,
            context={"request": request, "job": job},
        )
        serializer.is_valid(raise_exception=True)
        application = serializer.save()

        detail_serializer = ApplicationDetailSerializer(application, context={"request": request})
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class CandidateApplicationsListView(generics.ListAPIView):
    """
    GET /api/v1/candidate/applications/ — Candidate lists all their submitted job applications.
    """

    permission_classes = [IsAuthenticated, IsCandidate]
    serializer_class = ApplicationListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = (
            Application.objects.filter(candidate=self.request.user)
            .select_related("job", "resume")
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status", "").strip().upper()
        if status_param and status_param in ApplicationStatus.values:
            queryset = queryset.filter(status=status_param)

        return queryset


class JobApplicantsListView(generics.ListAPIView):
    """
    GET /api/v1/jobs/{id}/applications/ — Recruiter views candidates who applied for their job.
    """

    permission_classes = [IsAuthenticated, IsRecruiter]
    serializer_class = ApplicationListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        job_id = self.kwargs.get("id")
        job = get_object_or_404(JobPosting, id=job_id)

        # Enforce recruiter ownership
        if job.recruiter != self.request.user:
            raise PermissionDenied("You can only view applicants for job postings you own.")

        queryset = (
            Application.objects.filter(job=job)
            .select_related("candidate", "resume")
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status", "").strip().upper()
        if status_param and status_param in ApplicationStatus.values:
            queryset = queryset.filter(status=status_param)

        return queryset


class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/v1/applications/{id}/ — View full application & extracted resume.
    PATCH /api/v1/applications/{id}/ — Update application status (enforcing RBAC transitions).
    """

    permission_classes = [IsAuthenticated, IsApplicationParticipant]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ApplicationStatusUpdateSerializer
        return ApplicationDetailSerializer

    def get_queryset(self):
        return Application.objects.select_related("job", "candidate", "resume")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_app = serializer.save()

        detail_serializer = ApplicationDetailSerializer(updated_app, context={"request": request})
        return Response(detail_serializer.data, status=status.HTTP_200_OK)
