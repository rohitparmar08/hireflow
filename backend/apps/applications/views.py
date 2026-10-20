import re
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


from apps.accounts.permissions import IsRecruiter
from apps.jobs.models import JobPosting
from apps.jobs.pagination import StandardResultsSetPagination
from .models import Application, ApplicationStatus, JobApplicationMatch
from .permissions import IsCandidate, IsApplicationParticipant
from .serializers import (
    ApplicationDetailSerializer,
    ApplicationListSerializer,
    ApplicationStatusUpdateSerializer,
    ApplicationSubmissionSerializer,
    JobApplicationMatchSerializer,
)
from .services.matching_engine import compute_and_save_match



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
            .select_related("job", "resume", "match_result")
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status", "").strip().upper()
        if status_param and status_param in ApplicationStatus.values:
            queryset = queryset.filter(status=status_param)

        return queryset


class JobApplicantsListView(generics.ListAPIView):
    """
    GET /api/v1/jobs/{id}/applications/ — Recruiter views candidates who applied for their job.
    Supports filtering by status and sorting by match score or submission date.
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
            .select_related("candidate", "resume", "match_result")
        )

        status_param = self.request.query_params.get("status", "").strip().upper()
        if status_param and status_param in ApplicationStatus.values:
            queryset = queryset.filter(status=status_param)

        # Optional filter by minimum match score
        min_score = self.request.query_params.get("min_score")
        if min_score is not None and min_score != "":
            try:
                queryset = queryset.filter(match_result__overall_score__gte=float(min_score))
            except ValueError:
                pass

        # Configurable ordering: match_score, -match_score, created_at, -created_at
        ordering = self.request.query_params.get("ordering", "-created_at").strip()
        if ordering in ["match_score", "-match_score"]:
            prefix = "-" if ordering.startswith("-") else ""
            queryset = queryset.order_by(f"{prefix}match_result__overall_score", "-created_at")
        elif ordering in ["created_at", "-created_at"]:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by("-created_at")

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
        return Application.objects.select_related("job", "candidate", "resume", "match_result")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_app = serializer.save()

        detail_serializer = ApplicationDetailSerializer(updated_app, context={"request": request})
        return Response(detail_serializer.data, status=status.HTTP_200_OK)


class ApplicationMatchView(APIView):
    """
    GET /api/v1/applications/{id}/match/ — Retrieve explainable AI matching score & breakdown.
    POST /api/v1/applications/{id}/match/ — Recalculate/refresh match score & breakdown.
    Enforces participant RBAC: Candidate who applied or Recruiter owning the job only.
    """

    permission_classes = [IsAuthenticated]

    def _get_authorized_application(self, request, id):
        application = get_object_or_404(
            Application.objects.select_related("job", "candidate", "resume", "match_result"),
            id=id,
        )
        user = request.user
        if application.candidate != user and application.job.recruiter != user:
            raise PermissionDenied("You do not have permission to view or calculate match results for this application.")
        return application

    def get(self, request, id, *args, **kwargs):
        application = self._get_authorized_application(request, id)

        if hasattr(application, "match_result") and application.match_result:
            match_record = application.match_result
        else:
            match_record = compute_and_save_match(application)

        serializer = JobApplicationMatchSerializer(match_record)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, id, *args, **kwargs):
        application = self._get_authorized_application(request, id)
        # Force recalculation
        match_record = compute_and_save_match(application)
        serializer = JobApplicationMatchSerializer(match_record)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ResumeDownloadView(APIView):
    """
    GET /api/v1/applications/{id}/resume/
    Securely downloads the candidate's uploaded resume document.
    Enforces object-level RBAC: Only the applicant candidate or the owning recruiter can access.
    Streams using FileResponse with secure headers to prevent path traversal or public media leaks.
    """

    permission_classes = [IsAuthenticated, IsApplicationParticipant]

    def get(self, request, id, *args, **kwargs):
        application = get_object_or_404(
            Application.objects.select_related("job", "candidate", "resume"),
            id=id,
        )
        self.check_object_permissions(request, application)

        resume = getattr(application, "resume", None)
        if not resume or not resume.file:
            raise NotFound("No resume document found for this application.")

        try:
            file_handle = resume.file.open("rb")
        except (FileNotFoundError, OSError):
            raise NotFound("Resume document file not found on storage.")

        content_type = resume.content_type or "application/octet-stream"
        safe_filename = re.sub(r"[^\w\.-]", "_", resume.original_filename or "resume.pdf")

        response = FileResponse(file_handle, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{safe_filename}"'
        response["X-Content-Type-Options"] = "nosniff"
        return response


