from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsRecruiter
from .models import JobPosting, JobStatus
from .pagination import StandardResultsSetPagination
from .permissions import IsJobOwner
from .serializers import (
    JobPostingCreateUpdateSerializer,
    JobPostingDetailSerializer,
    JobPostingListSerializer,
)


class JobListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/jobs/ — Public list of active jobs with search, filtering, and pagination.
    POST /api/v1/jobs/ — Recruiter-only creation of new job postings.
    """

    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsRecruiter()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return JobPostingCreateUpdateSerializer
        return JobPostingListSerializer

    def get_queryset(self):
        queryset = JobPosting.objects.filter(status=JobStatus.ACTIVE).select_related("recruiter")

        # 1. Search Query (title, company, description)
        search_query = self.request.query_params.get("search", "").strip()
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query)
                | Q(company_name__icontains=search_query)
                | Q(description__icontains=search_query)
            )

        # 2. Location filter
        location = self.request.query_params.get("location", "").strip()
        if location:
            queryset = queryset.filter(location__icontains=location)

        # 3. Location Type (REMOTE, HYBRID, ONSITE)
        location_type = self.request.query_params.get("location_type", "").strip().upper()
        if location_type:
            queryset = queryset.filter(location_type=location_type)

        # 4. Employment Type (FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP)
        employment_type = self.request.query_params.get("employment_type", "").strip().upper()
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)

        # 5. Experience Level (ENTRY, MID, SENIOR, LEAD, EXECUTIVE)
        experience_level = self.request.query_params.get("experience_level", "").strip().upper()
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)

        # 6. Minimum Salary threshold
        min_salary = self.request.query_params.get("min_salary", "").strip()
        if min_salary:
            try:
                min_val = float(min_salary)
                queryset = queryset.filter(Q(max_salary__gte=min_val) | Q(min_salary__gte=min_val))
            except ValueError:
                pass

        # 7. Skill filter (checks required or optional skills JSON arrays)
        skill = self.request.query_params.get("skill", "").strip()
        if skill:
            queryset = queryset.filter(
                Q(required_skills__icontains=skill) | Q(optional_skills__icontains=skill)
            )

        return queryset.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()

        # Return comprehensive detail serialization upon creation
        detail_serializer = JobPostingDetailSerializer(job, context={"request": request})
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class JobDetailUpdateArchiveView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/jobs/{id}/ — Public job details (AllowAny for ACTIVE, Recruiter owner for DRAFT/CLOSED).
    PATCH /api/v1/jobs/{id}/ — Partial update (Job owner only).
    PUT /api/v1/jobs/{id}/ — Full update (Job owner only).
    DELETE /api/v1/jobs/{id}/ — Soft-delete / Archive job to CLOSED status (Job owner only).
    """

    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated(), IsJobOwner()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return JobPostingCreateUpdateSerializer
        return JobPostingDetailSerializer

    def get_object(self):
        job_id = self.kwargs.get("id")
        job = get_object_or_404(JobPosting.objects.select_related("recruiter"), id=job_id)

        # Check permission for write operations
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            self.check_object_permissions(self.request, job)
            return job

        # Read operation (GET)
        if job.status == JobStatus.ACTIVE:
            return job

        user = self.request.user
        if user.is_authenticated and job.recruiter == user:
            return job

        raise NotFound("No active job posting found with this ID.")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_job = serializer.save()

        detail_serializer = JobPostingDetailSerializer(updated_job, context={"request": request})
        return Response(detail_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        job.archive()
        return Response(
            {
                "message": "Job successfully closed and archived.",
                "id": str(job.id),
                "status": job.status,
            },
            status=status.HTTP_200_OK,
        )


class RecruiterJobsListView(generics.ListAPIView):
    """
    GET /api/v1/recruiter/jobs/ — Recruiter's personal postings (DRAFT, ACTIVE, CLOSED).
    """

    permission_classes = [IsAuthenticated, IsRecruiter]
    serializer_class = JobPostingListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = JobPosting.objects.filter(recruiter=self.request.user).order_by("-created_at")

        status_param = self.request.query_params.get("status", "").strip().upper()
        if status_param and status_param in JobStatus.values:
            queryset = queryset.filter(status=status_param)

        return queryset
