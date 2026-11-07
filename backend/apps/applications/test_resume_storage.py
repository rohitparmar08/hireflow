import os

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role
from apps.applications.models import Resume
from apps.applications.tests import generate_test_pdf
from apps.jobs.models import JobPosting, JobStatus

User = get_user_model()


class ResumeSurvivesLostDiskTests(APITestCase):
    """Free hosts wipe the disk on restart, so the resume must still download from the database."""

    def setUp(self):
        self.recruiter = User.objects.create_user(
            email="rec@talent.com", password="Password123!", first_name="R", last_name="One",
            role=Role.RECRUITER, company_name="TalentCo",
        )
        self.candidate = User.objects.create_user(
            email="cand@dev.com", password="Password123!", first_name="C", last_name="Two", role=Role.CANDIDATE,
        )
        self.job = JobPosting.objects.create(
            recruiter=self.recruiter, title="Python Dev", company_name="TalentCo", location="Remote",
            description="Python and Django.", required_skills=["Python"], status=JobStatus.ACTIVE,
        )
        self.pdf_bytes = generate_test_pdf("Candidate Two\nPython Django developer")
        self.client.force_authenticate(self.candidate)
        res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": SimpleUploadedFile("resume.pdf", self.pdf_bytes, content_type="application/pdf")},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.application_id = res.data["id"]
        self.resume = Resume.objects.get(application_id=self.application_id)
        self.url = reverse("applications-v1:resume_download", kwargs={"id": self.application_id})

    def download(self):
        res = self.client.get(self.url)
        return res, b"".join(res.streaming_content) if res.status_code == 200 else b""

    def test_upload_keeps_a_copy_of_the_file_in_the_database(self):
        self.assertEqual(bytes(self.resume.file_content), self.pdf_bytes)

    def test_download_works_after_the_file_on_disk_is_deleted(self):
        os.remove(self.resume.file.path)
        res, body = self.download()
        self.assertEqual(res.status_code, 200)
        self.assertEqual(body, self.pdf_bytes)

    def test_missing_file_and_missing_database_copy_gives_404(self):
        os.remove(self.resume.file.path)
        Resume.objects.filter(pk=self.resume.pk).update(file_content=None)
        self.assertEqual(self.client.get(self.url).status_code, 404)

    def test_binary_content_is_never_exposed_in_the_api(self):
        res = self.client.get(reverse("applications-v1:application_detail", kwargs={"id": self.application_id}))
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("file_content", res.data["resume"])

    def test_other_users_still_cannot_download_it(self):
        stranger = User.objects.create_user(
            email="x@dev.com", password="Password123!", first_name="X", last_name="Y", role=Role.CANDIDATE,
        )
        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.get(self.url).status_code, 403)
