from unittest import mock

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from apps.accounts.models import Role
from apps.applications.tests import generate_test_pdf
from apps.jobs.models import JobPosting, JobStatus
from django.contrib.auth import get_user_model

User = get_user_model()


class RateLimitTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        patcher = mock.patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"auth": "3/min", "apply": "2/hour"})
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_login_is_limited_per_ip(self):
        url = reverse("auth-v1:login")
        for _ in range(3):
            self.assertEqual(self.client.post(url, {"email": "a@b.com", "password": "wrong"}).status_code, 401)
        self.assertEqual(self.client.post(url, {"email": "a@b.com", "password": "wrong"}).status_code, 429)

    def test_registration_is_limited_per_ip(self):
        url = reverse("auth-v1:register")
        for _ in range(3):
            self.assertEqual(self.client.post(url, {}, format="json").status_code, 400)
        self.assertEqual(self.client.post(url, {}, format="json").status_code, 429)

    def test_job_applications_are_limited_per_user(self):
        recruiter = User.objects.create_user(
            email="r@talent.com", password="Password123!", first_name="R", last_name="X",
            role=Role.RECRUITER, company_name="Co",
        )
        candidate = User.objects.create_user(
            email="c@dev.com", password="Password123!", first_name="C", last_name="Y", role=Role.CANDIDATE,
        )
        jobs = [
            JobPosting.objects.create(
                recruiter=recruiter, title=f"Job {i}", company_name="Co", location="Remote",
                description="Python", required_skills=["Python"], status=JobStatus.ACTIVE,
            )
            for i in range(3)
        ]
        self.client.force_authenticate(candidate)
        codes = []
        for job in jobs:
            res = self.client.post(
                reverse("applications-v1:job_apply", kwargs={"id": job.id}),
                {"file": SimpleUploadedFile("cv.pdf", generate_test_pdf(), content_type="application/pdf")},
                format="multipart",
            )
            codes.append(res.status_code)
        self.assertEqual(codes, [201, 201, 429])
