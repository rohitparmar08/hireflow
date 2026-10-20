from rest_framework import serializers
from .models import JobPosting, JobStatus, LocationType, EmploymentType, ExperienceLevel


class JobPostingListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for public and recruiter job listings.
    """

    recruiter_name = serializers.CharField(source="recruiter.get_full_name", read_only=True)
    applications_count = serializers.IntegerField(default=0, read_only=True)

    class Meta:
        model = JobPosting
        fields = [
            "id",
            "title",
            "company_name",
            "location",
            "location_type",
            "employment_type",
            "experience_level",
            "min_salary",
            "max_salary",
            "salary_currency",
            "required_skills",
            "status",
            "recruiter_name",
            "applications_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class JobPostingDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for single job posting detail view.
    """

    recruiter_id = serializers.UUIDField(source="recruiter.id", read_only=True)
    recruiter_name = serializers.CharField(source="recruiter.get_full_name", read_only=True)
    recruiter_email = serializers.EmailField(source="recruiter.email", read_only=True)
    applications_count = serializers.IntegerField(default=0, read_only=True)

    class Meta:
        model = JobPosting
        fields = [
            "id",
            "recruiter_id",
            "recruiter_name",
            "recruiter_email",
            "title",
            "company_name",
            "location",
            "location_type",
            "employment_type",
            "experience_level",
            "description",
            "required_skills",
            "optional_skills",
            "min_salary",
            "max_salary",
            "salary_currency",
            "status",
            "applications_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "recruiter_id",
            "recruiter_name",
            "recruiter_email",
            "applications_count",
            "created_at",
            "updated_at",
        ]


class JobPostingCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used by recruiters to create and update job postings.
    Enforces validation on salaries, skills normalization, and owner assignment.
    """

    company_name = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Company name posting this role (defaults to recruiter's registered company).",
    )
    required_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=False,
        help_text="Provide at least one required skill string.",
    )
    optional_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
    )

    class Meta:
        model = JobPosting
        fields = [
            "id",
            "title",
            "company_name",
            "location",
            "location_type",
            "employment_type",
            "experience_level",
            "description",
            "required_skills",
            "optional_skills",
            "min_salary",
            "max_salary",
            "salary_currency",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_title(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("Job title cannot be blank.")
        return stripped

    def validate_required_skills(self, value):
        normalized = [s.strip() for s in value if s and s.strip()]
        if not normalized:
            raise serializers.ValidationError("At least one non-empty required skill is required.")
        # Deduplicate while preserving order
        return list(dict.fromkeys(normalized))

    def validate_optional_skills(self, value):
        if not value:
            return []
        normalized = [s.strip() for s in value if s and s.strip()]
        return list(dict.fromkeys(normalized))

    def validate(self, attrs):
        min_salary = attrs.get("min_salary", getattr(self.instance, "min_salary", None))
        max_salary = attrs.get("max_salary", getattr(self.instance, "max_salary", None))

        if min_salary is not None and min_salary < 0:
            raise serializers.ValidationError({"min_salary": "Minimum salary cannot be negative."})

        if max_salary is not None and max_salary < 0:
            raise serializers.ValidationError({"max_salary": "Maximum salary cannot be negative."})

        if min_salary is not None and max_salary is not None and min_salary > max_salary:
            raise serializers.ValidationError(
                {"max_salary": "Maximum salary must be greater than or equal to minimum salary."}
            )

        # Default company name to recruiter's company_name if empty
        request = self.context.get("request")
        if not attrs.get("company_name") and request and hasattr(request.user, "company_name"):
            attrs["company_name"] = request.user.company_name or "Hiring Company"

        return attrs

    def create(self, validated_data):
        # Automatically bind logged-in recruiter as the owner
        validated_data["recruiter"] = self.context["request"].user
        return super().create(validated_data)
