from django.contrib import admin
from .models import JobPosting


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "company_name",
        "location_type",
        "employment_type",
        "experience_level",
        "status",
        "recruiter",
        "created_at",
    ]
    list_filter = ["status", "location_type", "employment_type", "experience_level", "created_at"]
    search_fields = ["title", "company_name", "location", "description"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-created_at"]
