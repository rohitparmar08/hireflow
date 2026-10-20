from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from apps.jobs.models import JobPosting, JobStatus
from .models import Application, ApplicationStatus, JobApplicationMatch, ParsingStatus, Resume
from .services.matching_engine import compute_and_save_match
from .services.resume_parser import validate_resume_file, parse_resume_instance


class JobApplicationMatchSerializer(serializers.ModelSerializer):
    """
    Serializer for explainable AI match calculation and breakdown.
    """

    job_title = serializers.CharField(source="application.job.title", read_only=True)
    candidate_name = serializers.CharField(source="application.candidate.get_full_name", read_only=True)

    class Meta:
        model = JobApplicationMatch
        fields = [
            "id",
            "overall_score",
            "skills_score",
            "similarity_score",
            "experience_score",
            "education_score",
            "matching_skills",
            "missing_skills",
            "breakdown",
            "job_title",
            "candidate_name",
            "calculated_at",
        ]
        read_only_fields = fields


class ResumeSerializer(serializers.ModelSerializer):
    """
    Serializer for uploaded resume document and extracted parsing results.
    """

    file_url = serializers.FileField(source="file", read_only=True)

    class Meta:
        model = Resume
        fields = [
            "id",
            "file_url",
            "original_filename",
            "file_size",
            "content_type",
            "raw_text",
            "parsed_data",
            "parsing_status",
            "parsing_error",
            "uploaded_at",
        ]
        read_only_fields = fields


class ApplicationListSerializer(serializers.ModelSerializer):
    """
    Summary serializer for application listings (Candidate tracker & Recruiter applicants).
    """

    job_title = serializers.CharField(source="job.title", read_only=True)
    company_name = serializers.CharField(source="job.company_name", read_only=True)
    job_location = serializers.CharField(source="job.location", read_only=True)
    job_status = serializers.CharField(source="job.status", read_only=True)

    candidate_name = serializers.CharField(source="candidate.get_full_name", read_only=True)
    candidate_email = serializers.EmailField(source="candidate.email", read_only=True)
    candidate_headline = serializers.CharField(source="candidate.headline", read_only=True)

    parsed_skills = serializers.SerializerMethodField()
    parsing_status = serializers.CharField(source="resume.parsing_status", read_only=True)
    match_score = serializers.SerializerMethodField()
    matching_skills_count = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "job",
            "job_title",
            "company_name",
            "job_location",
            "job_status",
            "candidate",
            "candidate_name",
            "candidate_email",
            "candidate_headline",
            "status",
            "cover_note",
            "parsed_skills",
            "parsing_status",
            "match_score",
            "matching_skills_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_parsed_skills(self, obj):
        if hasattr(obj, "resume") and obj.resume and obj.resume.parsed_data:
            return obj.resume.parsed_data.get("skills", [])[:8]
        return []

    def get_match_score(self, obj):
        if hasattr(obj, "match_result") and obj.match_result:
            return obj.match_result.overall_score
        return None

    def get_matching_skills_count(self, obj):
        if hasattr(obj, "match_result") and obj.match_result:
            return len(obj.match_result.matching_skills or [])
        return 0


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer providing full resume text, candidate info, and job specifications.
    """

    job_id = serializers.UUIDField(source="job.id", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    company_name = serializers.CharField(source="job.company_name", read_only=True)
    job_location = serializers.CharField(source="job.location", read_only=True)
    job_status = serializers.CharField(source="job.status", read_only=True)

    candidate = UserSerializer(read_only=True)
    resume = ResumeSerializer(read_only=True)
    match_result = JobApplicationMatchSerializer(read_only=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "job_id",
            "job_title",
            "company_name",
            "job_location",
            "job_status",
            "candidate",
            "status",
            "cover_note",
            "resume",
            "match_result",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ApplicationSubmissionSerializer(serializers.Serializer):
    """
    Serializer handling candidate application submissions with resume file upload.
    """

    file = serializers.FileField(write_only=True, required=True)
    cover_note = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
    )

    def validate_file(self, value):
        validate_resume_file(value)
        return value

    def validate(self, attrs):
        request = self.context["request"]
        job = self.context["job"]
        candidate = request.user

        # 1. Job must be active
        if job.status != JobStatus.ACTIVE:
            raise serializers.ValidationError("This job posting is no longer active and cannot accept new applications.")

        # 2. Duplicate check
        if Application.objects.filter(candidate=candidate, job=job).exists():
            raise serializers.ValidationError("You have already submitted an application for this job opening.")

        return attrs

    def create(self, validated_data):
        file_obj = validated_data.pop("file")
        cover_note = validated_data.get("cover_note", "")
        request = self.context["request"]
        job = self.context["job"]
        candidate = request.user

        # 1. Create Application
        application = Application.objects.create(
            candidate=candidate,
            job=job,
            cover_note=cover_note,
            status=ApplicationStatus.SUBMITTED,
        )

        # 2. Create Resume record
        resume = Resume.objects.create(
            application=application,
            file=file_obj,
            original_filename=file_obj.name,
            file_size=file_obj.size,
            content_type=getattr(file_obj, "content_type", "application/octet-stream"),
            parsing_status=ParsingStatus.PENDING,
        )

        # 3. Synchronously extract text and detect skills
        parse_resume_instance(resume)

        # 4. Synchronously compute initial explainable AI match
        try:
            compute_and_save_match(application)
        except Exception:
            pass

        return application


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer enforcing role-based status transitions for applications.
    """

    class Meta:
        model = Application
        fields = ["status"]

    def validate_status(self, value):
        instance = self.instance
        user = self.context["request"].user

        allowed, reason = instance.can_transition_to(value, user)
        if not allowed:
            raise serializers.ValidationError(reason)

        return value
