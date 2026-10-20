import os
import uuid
from pathlib import Path
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class ApplicationStatus(models.TextChoices):
    SUBMITTED = "SUBMITTED", _("Submitted")
    IN_REVIEW = "IN_REVIEW", _("In Review")
    SHORTLISTED = "SHORTLISTED", _("Shortlisted")
    REJECTED = "REJECTED", _("Rejected")
    WITHDRAWN = "WITHDRAWN", _("Withdrawn")


class ParsingStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    PARSED = "PARSED", _("Parsed")
    FAILED = "FAILED", _("Failed")


def resume_upload_path(instance, filename):
    """
    Generate randomized, secure storage path for uploaded candidate resumes.
    e.g. resumes/<application_uuid>/<random_hex>.pdf
    """
    ext = Path(filename).suffix.lower()
    random_filename = f"{uuid.uuid4().hex}{ext}"
    return f"resumes/{instance.application_id}/{random_filename}"


class Application(models.Model):
    """
    Represents a candidate's formal application for a specific job posting.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
        help_text=_("The candidate who submitted this application."),
    )
    job = models.ForeignKey(
        "jobs.JobPosting",
        on_delete=models.CASCADE,
        related_name="applications",
        help_text=_("The job posting being applied for."),
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.SUBMITTED,
        db_index=True,
    )
    cover_note = models.TextField(
        _("cover note"),
        blank=True,
        default="",
        help_text=_("Optional note or statement from candidate to recruiter."),
    )

    created_at = models.DateTimeField(_("submitted at"), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(_("last updated"), auto_now=True)

    class Meta:
        verbose_name = _("job application")
        verbose_name_plural = _("job applications")
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"],
                name="unique_candidate_job_application",
            )
        ]
        indexes = [
            models.Index(fields=["job", "status"]),
            models.Index(fields=["candidate", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.candidate.get_full_name()} -> {self.job.title} ({self.status})"

    def can_transition_to(self, new_status, user):
        """
        Enforce valid state transitions based on actor role.
        """
        if self.status == ApplicationStatus.WITHDRAWN:
            return False, "Cannot alter an application that has been withdrawn by the candidate."

        # Recruiter actions
        if user == self.job.recruiter:
            if new_status == ApplicationStatus.WITHDRAWN:
                return False, "Only candidates can withdraw their own applications."
            if new_status in [
                ApplicationStatus.IN_REVIEW,
                ApplicationStatus.SHORTLISTED,
                ApplicationStatus.REJECTED,
                ApplicationStatus.SUBMITTED,
            ]:
                return True, ""
            return False, f"Invalid recruiter status: {new_status}"

        # Candidate actions
        if user == self.candidate:
            if self.status == ApplicationStatus.REJECTED:
                return False, "Cannot withdraw an application that has already been rejected."
            if new_status == ApplicationStatus.WITHDRAWN:
                return True, ""
            return False, "Candidates can only withdraw their application."


        return False, "You do not have permission to change this application status."


class Resume(models.Model):
    """
    Stores uploaded candidate resume file and extracted structured text/metadata.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name="resume",
    )
    file = models.FileField(upload_to=resume_upload_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text=_("File size in bytes"))
    content_type = models.CharField(max_length=100)

    # Ingestion & Extraction fields
    raw_text = models.TextField(blank=True, default="", help_text=_("Raw extracted text from document."))
    parsed_data = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Structured entities: contact, skills, education, experience."),
    )
    parsing_status = models.CharField(
        max_length=20,
        choices=ParsingStatus.choices,
        default=ParsingStatus.PENDING,
        db_index=True,
    )
    parsing_error = models.TextField(blank=True, default="")

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("candidate resume")
        verbose_name_plural = _("candidate resumes")
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Resume for {self.application} ({self.parsing_status})"


class JobApplicationMatch(models.Model):
    """
    Stores explainable AI resume-to-job matching calculation and score breakdown.
    Decoupled from core application lifecycle for fast retrieval and on-demand recalculation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name="match_result",
    )
    overall_score = models.FloatField(
        _("overall match score"),
        default=0.0,
        db_index=True,
        help_text=_("Normalized match score from 0.0 to 100.0"),
    )
    skills_score = models.FloatField(default=0.0)
    similarity_score = models.FloatField(default=0.0)
    experience_score = models.FloatField(default=0.0)
    education_score = models.FloatField(default=0.0)

    matching_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    breakdown = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Detailed breakdown of component weights, scores, contributions, and explanations."),
    )

    calculated_at = models.DateTimeField(_("calculated at"), auto_now=True)

    class Meta:
        verbose_name = _("application match result")
        verbose_name_plural = _("application match results")
        ordering = ["-overall_score"]
        indexes = [
            models.Index(fields=["-overall_score"]),
        ]

    def __str__(self):
        return f"Match {self.overall_score}% for {self.application}"

