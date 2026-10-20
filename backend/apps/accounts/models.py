import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager


class Role(models.TextChoices):
    RECRUITER = "RECRUITER", _("Recruiter")
    CANDIDATE = "CANDIDATE", _("Candidate")


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for HireFlow supporting Role-Based Access Control (RBAC).
    Email serves as the unique login username.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        _("email address"),
        unique=True,
        max_length=255,
        db_index=True,
    )
    first_name = models.CharField(_("first name"), max_length=150)
    last_name = models.CharField(_("last name"), max_length=150)
    role = models.CharField(
        _("role"),
        max_length=20,
        choices=Role.choices,
        default=Role.CANDIDATE,
        db_index=True,
    )

    # Profile & Identity fields
    company_name = models.CharField(
        _("company name"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Applicable for recruiters representing a company or agency."),
    )
    phone_number = models.CharField(
        _("phone number"),
        max_length=30,
        blank=True,
        default="",
    )
    headline = models.CharField(
        _("headline"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("e.g. Senior Full-Stack Engineer | Python & React"),
    )
    bio = models.TextField(
        _("bio / summary"),
        blank=True,
        default="",
    )

    # Permission & Status flags
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into this admin site."),
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )

    # Audit timestamps
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)
    updated_at = models.DateTimeField(_("last updated"), auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email

    def get_short_name(self):
        return self.first_name if self.first_name else self.email

    @property
    def is_recruiter(self):
        return self.role == Role.RECRUITER

    @property
    def is_candidate(self):
        return self.role == Role.CANDIDATE
