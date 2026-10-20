import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class JobStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    ACTIVE = "ACTIVE", _("Active")
    CLOSED = "CLOSED", _("Closed / Archived")


class LocationType(models.TextChoices):
    REMOTE = "REMOTE", _("Remote")
    HYBRID = "HYBRID", _("Hybrid")
    ONSITE = "ONSITE", _("On-site")


class EmploymentType(models.TextChoices):
    FULL_TIME = "FULL_TIME", _("Full-time")
    PART_TIME = "PART_TIME", _("Part-time")
    CONTRACT = "CONTRACT", _("Contract")
    INTERNSHIP = "INTERNSHIP", _("Internship")


class ExperienceLevel(models.TextChoices):
    ENTRY = "ENTRY", _("Entry-level")
    MID = "MID", _("Mid-level")
    SENIOR = "SENIOR", _("Senior")
    LEAD = "LEAD", _("Lead / Principal")
    EXECUTIVE = "EXECUTIVE", _("Executive / Director")


class JobPosting(models.Model):
    """
    Represents an employment opening posted and managed by a recruiter.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_postings",
        help_text=_("Recruiter account that created and owns this job posting."),
    )

    title = models.CharField(_("job title"), max_length=255, db_index=True)
    company_name = models.CharField(_("company name"), max_length=255, db_index=True)
    location = models.CharField(_("location"), max_length=255, help_text=_("e.g. San Francisco, CA or Remote"))
    location_type = models.CharField(
        _("location type"),
        max_length=20,
        choices=LocationType.choices,
        default=LocationType.REMOTE,
        db_index=True,
    )
    employment_type = models.CharField(
        _("employment type"),
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
        db_index=True,
    )
    experience_level = models.CharField(
        _("experience level"),
        max_length=20,
        choices=ExperienceLevel.choices,
        default=ExperienceLevel.MID,
        db_index=True,
    )

    description = models.TextField(_("job description"))

    required_skills = models.JSONField(
        _("required skills"),
        default=list,
        help_text=_("List of must-have technical/domain skills, e.g. ['Python', 'Django']"),
    )
    optional_skills = models.JSONField(
        _("optional skills"),
        default=list,
        blank=True,
        help_text=_("List of nice-to-have skills, e.g. ['Docker', 'AWS']"),
    )

    min_salary = models.DecimalField(
        _("minimum salary"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    max_salary = models.DecimalField(
        _("maximum salary"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    salary_currency = models.CharField(_("currency"), max_length=10, default="USD")

    status = models.CharField(
        _("status"),
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.ACTIVE,
        db_index=True,
    )

    created_at = models.DateTimeField(_("created at"), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(_("last updated"), auto_now=True)

    class Meta:
        verbose_name = _("job posting")
        verbose_name_plural = _("job postings")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["recruiter", "status"]),
        ]

    def __str__(self):
        return f"{self.title} at {self.company_name} ({self.status})"

    def clean(self):
        super().clean()
        if self.min_salary is not None and self.min_salary < 0:
            raise ValidationError({"min_salary": _("Minimum salary cannot be negative.")})
        if self.max_salary is not None and self.max_salary < 0:
            raise ValidationError({"max_salary": _("Maximum salary cannot be negative.")})
        if (
            self.min_salary is not None
            and self.max_salary is not None
            and self.min_salary > self.max_salary
        ):
            raise ValidationError({"max_salary": _("Maximum salary must be greater than or equal to minimum salary.")})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status == JobStatus.ACTIVE

    def archive(self):
        self.status = JobStatus.CLOSED
        self.save(update_fields=["status", "updated_at"])
