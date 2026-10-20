from django.urls import path
from .views import (
    ApplicationDetailView,
    ApplicationMatchView,
    CandidateApplicationsListView,
    JobApplicantsListView,
    JobApplicationSubmitView,
    ResumeDownloadView,
)

app_name = "applications"

urlpatterns = [
    # Candidate apply endpoint
    path("jobs/<uuid:id>/apply/", JobApplicationSubmitView.as_view(), name="job_apply"),
    # Candidate personal applications list
    path("candidate/applications/", CandidateApplicationsListView.as_view(), name="candidate_applications"),
    # Recruiter view applicants for a specific job
    path("jobs/<uuid:id>/applications/", JobApplicantsListView.as_view(), name="job_applicants"),
    # Application detail & status update
    path("applications/<uuid:id>/", ApplicationDetailView.as_view(), name="application_detail"),
    # Application explainable AI match calculation & retrieval
    path("applications/<uuid:id>/match/", ApplicationMatchView.as_view(), name="application_match"),
    # Secure, permission-controlled resume download
    path("applications/<uuid:id>/resume/", ResumeDownloadView.as_view(), name="resume_download"),
]


