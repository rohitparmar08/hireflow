import uuid
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Role
from apps.jobs.models import JobPosting, JobStatus, LocationType, EmploymentType, ExperienceLevel

User = get_user_model()


class JobManagementTests(APITestCase):
    """
    Test suite for HireFlow Phase 3 Job Management Module.
    """

    def setUp(self):
        # 1. Create Recruiter A
        self.recruiter_a = User.objects.create_user(
            email="recruiter_a@techcorp.com",
            password="Password123!",
            first_name="Alice",
            last_name="Recruiter",
            role=Role.RECRUITER,
            company_name="TechCorp Inc",
        )

        # 2. Create Recruiter B
        self.recruiter_b = User.objects.create_user(
            email="recruiter_b@startup.io",
            password="Password123!",
            first_name="Bob",
            last_name="Talent",
            role=Role.RECRUITER,
            company_name="StartupIO",
        )

        # 3. Create Candidate
        self.candidate = User.objects.create_user(
            email="candidate@dev.com",
            password="Password123!",
            first_name="Charlie",
            last_name="Coder",
            role=Role.CANDIDATE,
        )

        # URLs
        self.jobs_url = reverse("jobs-v1:job_list_create")
        self.recruiter_jobs_url = reverse("jobs-v1:recruiter_jobs")

        # Initial Active Job owned by Recruiter A
        self.active_job_a = JobPosting.objects.create(
            recruiter=self.recruiter_a,
            title="Senior Python Backend Engineer",
            company_name="TechCorp Inc",
            location="San Francisco, CA",
            location_type=LocationType.REMOTE,
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.SENIOR,
            description="Build scalable microservices with Django and PostgreSQL.",
            required_skills=["Python", "Django", "PostgreSQL"],
            optional_skills=["Docker", "AWS"],
            min_salary=140000,
            max_salary=180000,
            status=JobStatus.ACTIVE,
        )

        # Draft Job owned by Recruiter A
        self.draft_job_a = JobPosting.objects.create(
            recruiter=self.recruiter_a,
            title="Unpublished Frontend Engineer",
            company_name="TechCorp Inc",
            location="New York, NY",
            location_type=LocationType.HYBRID,
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.MID,
            description="Draft posting for React engineer.",
            required_skills=["React", "TypeScript"],
            status=JobStatus.DRAFT,
        )

    def test_public_list_active_jobs_only(self):
        # Anonymous user queries /jobs/
        response = self.client.get(self.jobs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        # Should only contain ACTIVE jobs (active_job_a), not draft_job_a
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Senior Python Backend Engineer")

    def test_public_view_active_job_detail(self):
        url = reverse("jobs-v1:job_detail", kwargs={"id": self.active_job_a.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Senior Python Backend Engineer")
        self.assertEqual(response.data["recruiter_name"], "Alice Recruiter")

    def test_public_view_draft_or_closed_job_returns_404(self):
        url = reverse("jobs-v1:job_detail", kwargs={"id": self.draft_job_a.id})
        # Anonymous user
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Candidate user
        self.client.force_authenticate(user=self.candidate)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Owning recruiter CAN view their own draft
        self.client.force_authenticate(user=self.recruiter_a)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Unpublished Frontend Engineer")

    def test_recruiter_create_job_success(self):
        self.client.force_authenticate(user=self.recruiter_a)
        payload = {
            "title": "Staff DevOps Engineer",
            "company_name": "TechCorp Inc",
            "location": "Austin, TX",
            "location_type": LocationType.ONSITE,
            "employment_type": EmploymentType.FULL_TIME,
            "experience_level": ExperienceLevel.LEAD,
            "description": "Lead cloud infrastructure and CI/CD automation pipelines.",
            "required_skills": ["Kubernetes", "Terraform", "AWS"],
            "optional_skills": ["Golang", "Prometheus"],
            "min_salary": 160000,
            "max_salary": 200000,
            "status": JobStatus.ACTIVE,
        }
        response = self.client.post(self.jobs_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Staff DevOps Engineer")
        self.assertEqual(response.data["recruiter_id"], str(self.recruiter_a.id))

        # Verify DB object
        job = JobPosting.objects.get(id=response.data["id"])
        self.assertEqual(job.recruiter, self.recruiter_a)

    def test_anonymous_and_candidate_cannot_create_jobs(self):
        payload = {
            "title": "Hacker Engineer",
            "description": "Unauthorized posting",
            "required_skills": ["Python"],
        }
        # Anonymous
        response = self.client.post(self.jobs_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Candidate
        self.client.force_authenticate(user=self.candidate)
        response = self.client.post(self.jobs_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_job_validation_salary_and_skills(self):
        self.client.force_authenticate(user=self.recruiter_a)

        # Negative min_salary
        bad_salary_payload = {
            "title": "QA Engineer",
            "location": "Remote",
            "description": "Testing software",
            "required_skills": ["Selenium"],
            "min_salary": -100,
        }
        response = self.client.post(self.jobs_url, bad_salary_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("min_salary", response.data)

        # min_salary > max_salary
        reversed_salary = {
            "title": "QA Engineer",
            "location": "Remote",
            "description": "Testing software",
            "required_skills": ["Selenium"],
            "min_salary": 150000,
            "max_salary": 100000,
        }
        response = self.client.post(self.jobs_url, reversed_salary, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("max_salary", response.data)

        # Empty required_skills
        empty_skills = {
            "title": "QA Engineer",
            "location": "Remote",
            "description": "Testing software",
            "required_skills": [],
        }
        response = self.client.post(self.jobs_url, empty_skills, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("required_skills", response.data)

    def test_recruiter_ownership_enforcement_on_update(self):
        url = reverse("jobs-v1:job_detail", kwargs={"id": self.active_job_a.id})

        # Recruiter B attempts to PATCH Recruiter A's job
        self.client.force_authenticate(user=self.recruiter_b)
        patch_payload = {"title": "Malicious Title Overwrite"}
        response = self.client.patch(url, patch_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Recruiter A legitimately edits their own job
        self.client.force_authenticate(user=self.recruiter_a)
        legit_payload = {"title": "Principal Python Backend Engineer"}
        response = self.client.patch(url, legit_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Principal Python Backend Engineer")

    def test_archive_job_sets_status_closed_not_hard_delete(self):
        url = reverse("jobs-v1:job_detail", kwargs={"id": self.active_job_a.id})

        # Recruiter B cannot archive Recruiter A's job
        self.client.force_authenticate(user=self.recruiter_b)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Recruiter A archives their job
        self.client.force_authenticate(user=self.recruiter_a)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], JobStatus.CLOSED)

        # Verify job still exists in DB, but status is CLOSED
        job = JobPosting.objects.get(id=self.active_job_a.id)
        self.assertEqual(job.status, JobStatus.CLOSED)

        # Verify it no longer appears in public active listing
        self.client.logout()
        list_response = self.client.get(self.jobs_url)
        self.assertEqual(list_response.data["count"], 0)

    def test_recruiter_personal_jobs_endpoint(self):
        # Recruiter A has active_job_a and draft_job_a
        self.client.force_authenticate(user=self.recruiter_a)
        response = self.client.get(self.recruiter_jobs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

        # Filter by status=DRAFT
        draft_response = self.client.get(f"{self.recruiter_jobs_url}?status=DRAFT")
        self.assertEqual(draft_response.data["count"], 1)
        self.assertEqual(draft_response.data["results"][0]["status"], JobStatus.DRAFT)

        # Recruiter B has 0 jobs
        self.client.force_authenticate(user=self.recruiter_b)
        response_b = self.client.get(self.recruiter_jobs_url)
        self.assertEqual(response_b.data["count"], 0)

    def test_search_and_filtering(self):
        # Create additional active job
        JobPosting.objects.create(
            recruiter=self.recruiter_a,
            title="Junior Frontend React Specialist",
            company_name="DesignTech",
            location="Chicago, IL",
            location_type=LocationType.ONSITE,
            employment_type=EmploymentType.CONTRACT,
            experience_level=ExperienceLevel.ENTRY,
            description="Looking for entry level React enthusiasm.",
            required_skills=["JavaScript", "React"],
            min_salary=60000,
            max_salary=80000,
            status=JobStatus.ACTIVE,
        )

        # Keyword search
        search_res = self.client.get(f"{self.jobs_url}?search=Python")
        self.assertEqual(search_res.data["count"], 1)
        self.assertEqual(search_res.data["results"][0]["title"], "Senior Python Backend Engineer")

        # Location Type filter
        loc_res = self.client.get(f"{self.jobs_url}?location_type=REMOTE")
        self.assertEqual(loc_res.data["count"], 1)

        # Employment Type filter
        emp_res = self.client.get(f"{self.jobs_url}?employment_type=CONTRACT")
        self.assertEqual(emp_res.data["count"], 1)
        self.assertEqual(emp_res.data["results"][0]["title"], "Junior Frontend React Specialist")

        # Skill filter
        skill_res = self.client.get(f"{self.jobs_url}?skill=React")
        self.assertEqual(skill_res.data["count"], 1)
        self.assertEqual(skill_res.data["results"][0]["title"], "Junior Frontend React Specialist")

        # Salary filter: jobs where max or min >= 150000
        salary_res = self.client.get(f"{self.jobs_url}?min_salary=150000")
        self.assertEqual(salary_res.data["count"], 1)
        self.assertEqual(salary_res.data["results"][0]["title"], "Senior Python Backend Engineer")
