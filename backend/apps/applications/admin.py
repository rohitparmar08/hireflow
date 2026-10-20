from django.contrib import admin
from .models import Application, JobApplicationMatch, Resume


class ResumeInline(admin.StackedInline):
    model = Resume
    extra = 0
    readonly_fields = ["id", "original_filename", "file_size", "content_type", "parsing_status", "uploaded_at"]


class JobApplicationMatchInline(admin.StackedInline):
    model = JobApplicationMatch
    extra = 0
    readonly_fields = ["id", "overall_score", "skills_score", "similarity_score", "experience_score", "education_score", "calculated_at"]


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ["candidate", "job", "status", "created_at", "updated_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["candidate__email", "candidate__first_name", "candidate__last_name", "job__title"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [ResumeInline, JobApplicationMatchInline]


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ["original_filename", "application", "file_size", "parsing_status", "uploaded_at"]
    list_filter = ["parsing_status", "uploaded_at"]
    search_fields = ["original_filename", "application__candidate__email"]
    readonly_fields = ["id", "uploaded_at"]


@admin.register(JobApplicationMatch)
class JobApplicationMatchAdmin(admin.ModelAdmin):
    list_display = ["application", "overall_score", "skills_score", "similarity_score", "experience_score", "education_score", "calculated_at"]
    list_filter = ["calculated_at"]
    search_fields = ["application__candidate__email", "application__job__title"]
    readonly_fields = ["id", "calculated_at"]

