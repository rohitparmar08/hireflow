from django.urls import path
from .views import (
    JobDetailUpdateArchiveView,
    JobListCreateView,
    RecruiterJobsListView,
)

app_name = "jobs"

urlpatterns = [
    path("jobs/", JobListCreateView.as_view(), name="job_list_create"),
    path("jobs/<uuid:id>/", JobDetailUpdateArchiveView.as_view(), name="job_detail"),
    path("recruiter/jobs/", RecruiterJobsListView.as_view(), name="recruiter_jobs"),
]
