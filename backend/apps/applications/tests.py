import io
import uuid
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import pypdf
import docx

from apps.accounts.models import Role
from apps.jobs.models import JobPosting, JobStatus, LocationType, EmploymentType, ExperienceLevel
from apps.applications.models import Application, ApplicationStatus, ParsingStatus, Resume

User = get_user_model()


def generate_test_pdf(content_text="John Doe john@example.com Python Django React developer."):
    """Helper to generate an exact, valid in-memory PDF binary stream with dynamic xref table."""
    clean_text = content_text.replace("(", "").replace(")", "").replace("\n", " ")
    body = f"BT /F1 12 Tf 72 712 Td ({clean_text}) Tj ET".encode("latin-1")
    stream_len = len(body)

    parts = [b"%PDF-1.4\n"]
    obj1 = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    obj3 = b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
    obj4 = f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin-1") + body + b"\nendstream\nendobj\n"
    obj5 = b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"

    offsets = []
    curr = len(parts[0])
    for obj in [obj1, obj2, obj3, obj4, obj5]:
        offsets.append(curr)
        curr += len(obj)
        parts.append(obj)

    xref_offset = curr
    xref = b"xref\n0 6\n0000000000 65535 f \n"
    for off in offsets:
        xref += f"{off:010d} 00000 n \n".encode("latin-1")
    parts.append(xref)

    trailer = f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("latin-1")
    parts.append(trailer)

    return b"".join(parts)


def generate_test_docx(content_text="Jane Developer\njane@example.com\nSkills: Python, Django, PostgreSQL, Docker"):
    """Helper to generate a valid in-memory DOCX binary stream."""
    doc = docx.Document()
    doc.add_paragraph(content_text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


class ApplicationAndResumeTests(APITestCase):
    """
    Test suite for Phase 4: Candidate Applications & Resume Ingestion Engine.
    """

    def setUp(self):
        # 1. Recruiter A (Job owner)
        self.recruiter_a = User.objects.create_user(
            email="recruiter_a@talent.com",
            password="Password123!",
            first_name="Alice",
            last_name="Talent",
            role=Role.RECRUITER,
            company_name="TalentCo",
        )

        # 2. Recruiter B (Different recruiter)
        self.recruiter_b = User.objects.create_user(
            email="recruiter_b@agency.com",
            password="Password123!",
            first_name="Bob",
            last_name="Agency",
            role=Role.RECRUITER,
            company_name="AgencyGlobal",
        )

        # 3. Candidate 1
        self.candidate_1 = User.objects.create_user(
            email="candidate1@dev.com",
            password="Password123!",
            first_name="Charlie",
            last_name="Coder",
            role=Role.CANDIDATE,
        )

        # 4. Candidate 2
        self.candidate_2 = User.objects.create_user(
            email="candidate2@dev.com",
            password="Password123!",
            first_name="Diana",
            last_name="Engineer",
            role=Role.CANDIDATE,
        )

        # 5. Active Job
        self.job = JobPosting.objects.create(
            recruiter=self.recruiter_a,
            title="Senior Python Backend Engineer",
            company_name="TalentCo",
            location="Remote",
            location_type=LocationType.REMOTE,
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.SENIOR,
            description="Looking for experienced Python & Django engineers.",
            required_skills=["Python", "Django", "PostgreSQL"],
            status=JobStatus.ACTIVE,
        )

        # 6. Closed Job
        self.closed_job = JobPosting.objects.create(
            recruiter=self.recruiter_a,
            title="Closed Frontend Engineer",
            company_name="TalentCo",
            location="Remote",
            description="No longer hiring.",
            required_skills=["React"],
            status=JobStatus.CLOSED,
        )

    def test_successful_application_with_pdf_resume(self):
        self.client.force_authenticate(user=self.candidate_1)
        pdf_bytes = generate_test_pdf("Charlie Coder\ncharlie@dev.com\nPython, Django, PostgreSQL expert.")
        pdf_file = SimpleUploadedFile(
            "resume.pdf",
            pdf_bytes,
            content_type="application/pdf",
        )

        apply_url = reverse("applications-v1:job_apply", kwargs={"id": self.job.id})
        payload = {
            "file": pdf_file,
            "cover_note": "Excited to apply for this backend role!",
        }

        response = self.client.post(apply_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], ApplicationStatus.SUBMITTED)
        self.assertEqual(response.data["cover_note"], "Excited to apply for this backend role!")

        # Verify Resume ingestion
        self.assertIn("resume", response.data)
        resume_data = response.data["resume"]
        self.assertEqual(resume_data["original_filename"], "resume.pdf")
        self.assertEqual(resume_data["parsing_status"], ParsingStatus.PARSED)
        self.assertIn("Python", resume_data["parsed_data"]["skills"])

    def test_successful_application_with_docx_resume(self):
        self.client.force_authenticate(user=self.candidate_2)
        docx_bytes = generate_test_docx("Diana Engineer\ndiana@dev.com\nSkills: Python, Django, Docker, AWS")
        docx_file = SimpleUploadedFile(
            "diana_cv.docx",
            docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        apply_url = reverse("applications-v1:job_apply", kwargs={"id": self.job.id})
        payload = {"file": docx_file}

        response = self.client.post(apply_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["resume"]["parsing_status"], ParsingStatus.PARSED)
        self.assertIn("Docker", response.data["resume"]["parsed_data"]["skills"])

    def test_duplicate_application_fails(self):
        self.client.force_authenticate(user=self.candidate_1)
        pdf_bytes = generate_test_pdf()
        pdf_file = SimpleUploadedFile("resume.pdf", pdf_bytes, content_type="application/pdf")

        apply_url = reverse("applications-v1:job_apply", kwargs={"id": self.job.id})
        # 1st Application
        self.client.post(apply_url, {"file": pdf_file}, format="multipart")

        # 2nd Application (same candidate, same job)
        pdf_file2 = SimpleUploadedFile("resume2.pdf", pdf_bytes, content_type="application/pdf")
        res2 = self.client.post(apply_url, {"file": pdf_file2}, format="multipart")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already submitted an application", str(res2.data))

    def test_cannot_apply_to_closed_job(self):
        self.client.force_authenticate(user=self.candidate_1)
        pdf_bytes = generate_test_pdf()
        pdf_file = SimpleUploadedFile("resume.pdf", pdf_bytes, content_type="application/pdf")

        apply_url = reverse("applications-v1:job_apply", kwargs={"id": self.closed_job.id})
        response = self.client.post(apply_url, {"file": pdf_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no longer active", str(response.data))

    def test_invalid_and_oversized_file_uploads_fail(self):
        self.client.force_authenticate(user=self.candidate_1)
        apply_url = reverse("applications-v1:job_apply", kwargs={"id": self.job.id})

        # 1. Invalid extension (.txt)
        txt_file = SimpleUploadedFile("resume.txt", b"Plain text resume", content_type="text/plain")
        res1 = self.client.post(apply_url, {"file": txt_file}, format="multipart")
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Unsupported file format", str(res1.data))

        # 2. Fake PDF (invalid magic bytes)
        fake_pdf = SimpleUploadedFile("fake.pdf", b"NOT A REAL PDF CONTENT", content_type="application/pdf")
        res2 = self.client.post(apply_url, {"file": fake_pdf}, format="multipart")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Missing standard PDF file signature", str(res2.data))

        # 3. Oversized file (> 5 MB)
        oversized_data = b"%PDF-1.4\n" + (b"0" * (5 * 1024 * 1024 + 100))
        big_file = SimpleUploadedFile("big.pdf", oversized_data, content_type="application/pdf")
        res3 = self.client.post(apply_url, {"file": big_file}, format="multipart")
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exceeds the 5 MB limit", str(res3.data))

    def test_candidate_and_recruiter_permission_isolation(self):
        apply_url = reverse("applications-v1:job_apply", kwargs={"id": self.job.id})
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf(), content_type="application/pdf")

        # Anonymous cannot apply
        self.client.logout()
        res_anon = self.client.post(apply_url, {"file": pdf_file}, format="multipart")
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # Recruiter cannot apply
        self.client.force_authenticate(user=self.recruiter_a)
        res_rec = self.client.post(apply_url, {"file": pdf_file}, format="multipart")
        self.assertEqual(res_rec.status_code, status.HTTP_403_FORBIDDEN)

    def test_candidate_view_own_applications_only(self):
        # Candidate 1 applies
        self.client.force_authenticate(user=self.candidate_1)
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf(), content_type="application/pdf")
        self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )

        # Candidate 1 lists their applications
        list_url = reverse("applications-v1:candidate_applications")
        res1 = self.client.get(list_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["count"], 1)

        # Candidate 2 lists their applications -> should be 0
        self.client.force_authenticate(user=self.candidate_2)
        res2 = self.client.get(list_url)
        self.assertEqual(res2.data["count"], 0)

    def test_recruiter_view_applicants_for_own_job_only(self):
        # Candidate 1 applies to Job A (owned by Recruiter A)
        self.client.force_authenticate(user=self.candidate_1)
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf(), content_type="application/pdf")
        self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )

        job_applicants_url = reverse("applications-v1:job_applicants", kwargs={"id": self.job.id})

        # Recruiter A views applicants -> sees 1 applicant
        self.client.force_authenticate(user=self.recruiter_a)
        res_a = self.client.get(job_applicants_url)
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertEqual(res_a.data["count"], 1)
        self.assertEqual(res_a.data["results"][0]["candidate_email"], "candidate1@dev.com")

        # Recruiter B attempts to view applicants for Recruiter A's job -> 403 Forbidden
        self.client.force_authenticate(user=self.recruiter_b)
        res_b = self.client.get(job_applicants_url)
        self.assertEqual(res_b.status_code, status.HTTP_403_FORBIDDEN)

    def test_application_status_transitions(self):
        # Candidate applies
        self.client.force_authenticate(user=self.candidate_1)
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf(), content_type="application/pdf")
        app_res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )
        app_id = app_res.data["id"]
        detail_url = reverse("applications-v1:application_detail", kwargs={"id": app_id})

        # Candidate cannot shortlist themselves
        bad_status_res = self.client.patch(detail_url, {"status": ApplicationStatus.SHORTLISTED})
        self.assertEqual(bad_status_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Recruiter A moves status: SUBMITTED -> IN_REVIEW -> SHORTLISTED
        self.client.force_authenticate(user=self.recruiter_a)
        res_review = self.client.patch(detail_url, {"status": ApplicationStatus.IN_REVIEW})
        self.assertEqual(res_review.status_code, status.HTTP_200_OK)
        self.assertEqual(res_review.data["status"], ApplicationStatus.IN_REVIEW)

        res_shortlist = self.client.patch(detail_url, {"status": ApplicationStatus.SHORTLISTED})
        self.assertEqual(res_shortlist.status_code, status.HTTP_200_OK)
        self.assertEqual(res_shortlist.data["status"], ApplicationStatus.SHORTLISTED)

        # Recruiter cannot withdraw for candidate
        res_withdraw_rec = self.client.patch(detail_url, {"status": ApplicationStatus.WITHDRAWN})
        self.assertEqual(res_withdraw_rec.status_code, status.HTTP_400_BAD_REQUEST)

        # Candidate withdraws their application
        self.client.force_authenticate(user=self.candidate_1)
        res_withdraw = self.client.patch(detail_url, {"status": ApplicationStatus.WITHDRAWN})
        self.assertEqual(res_withdraw.status_code, status.HTTP_200_OK)
        self.assertEqual(res_withdraw.data["status"], ApplicationStatus.WITHDRAWN)

    def test_applications_remain_accessible_after_job_closure(self):
        # 1. Candidate applies while job is active
        self.client.force_authenticate(user=self.candidate_1)
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf(), content_type="application/pdf")
        app_res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )
        app_id = app_res.data["id"]

        # 2. Recruiter closes job
        self.job.archive()
        self.assertEqual(self.job.status, JobStatus.CLOSED)

        # 3. Candidate can still retrieve their historical application
        detail_url = reverse("applications-v1:application_detail", kwargs={"id": app_id})
        self.client.force_authenticate(user=self.candidate_1)
        cand_res = self.client.get(detail_url)
        self.assertEqual(cand_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cand_res.data["job_status"], JobStatus.CLOSED)

        # 4. Recruiter can still view applicant list
        self.client.force_authenticate(user=self.recruiter_a)
        rec_res = self.client.get(reverse("applications-v1:job_applicants", kwargs={"id": self.job.id}))
        self.assertEqual(rec_res.status_code, status.HTTP_200_OK)
        self.assertEqual(rec_res.data["count"], 1)


class AIMatchingEngineTests(APITestCase):
    """
    Test suite for Phase 5: AI Resume-to-Job Matching Engine & Explainable Scoring.
    """

    def setUp(self):
        # Recruiter
        self.recruiter_a = User.objects.create_user(
            email="recruiter_a@techhire.com",
            password="Password123!",
            first_name="Elena",
            last_name="Vance",
            role=Role.RECRUITER,
            company_name="TechCorp",
        )
        self.recruiter_b = User.objects.create_user(
            email="recruiter_b@techhire.com",
            password="Password123!",
            first_name="Barney",
            last_name="Calhoun",
            role=Role.RECRUITER,
            company_name="OtherCorp",
        )

        # Candidates
        self.candidate_1 = User.objects.create_user(
            email="candidate_1@dev.io",
            password="Password123!",
            first_name="Gordon",
            last_name="Freeman",
            role=Role.CANDIDATE,
        )
        self.candidate_2 = User.objects.create_user(
            email="candidate_2@dev.io",
            password="Password123!",
            first_name="Alyx",
            last_name="Vance",
            role=Role.CANDIDATE,
        )

        # Job posting with specific technical requirements
        self.job = JobPosting.objects.create(
            recruiter=self.recruiter_a,
            title="Senior Python Backend Engineer",
            company_name="TechCorp",
            location="San Francisco, CA",
            location_type=LocationType.REMOTE,
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.SENIOR,
            description="We are seeking a Senior Python Engineer with deep experience in Django, REST APIs, PostgreSQL, and Docker. 5+ years of experience required. Master's degree preferred.",
            required_skills=["Python", "Django", "PostgreSQL", "Docker"],
            optional_skills=["Redis", "Kubernetes", "AWS"],
            status=JobStatus.ACTIVE,
        )

    def test_matching_score_range_and_breakdown_weights(self):
        from apps.applications.services.matching_engine import calculate_match_breakdown

        class MockResume:
            raw_text = "Senior Python engineer with 6 years of experience building scalable Django REST APIs and Docker containers. M.S. in Computer Science. Skills: Python, Django, PostgreSQL, Docker, Redis."
            parsed_data = {
                "skills": ["Python", "Django", "PostgreSQL", "Docker", "Redis"],
                "education": ["Master", "M.S."],
            }

        result = calculate_match_breakdown(self.job, MockResume())

        # Assert score range
        self.assertGreaterEqual(result["overall_score"], 0.0)
        self.assertLessEqual(result["overall_score"], 100.0)

        # Assert weights sum to 100%
        weights = result["breakdown"]["weights"]
        self.assertEqual(sum(weights.values()), 100)

        # Assert component structure
        comps = result["breakdown"]["components"]
        self.assertIn("required_skills", comps)
        self.assertIn("optional_skills", comps)
        self.assertIn("text_similarity", comps)
        self.assertIn("experience_alignment", comps)
        self.assertIn("education_alignment", comps)

        for comp_name, comp_data in comps.items():
            self.assertGreaterEqual(comp_data["score"], 0.0)
            self.assertLessEqual(comp_data["score"], 100.0)

    def test_exact_and_case_insensitive_skill_matching(self):
        from apps.applications.services.matching_engine import compute_skill_overlap

        job_skills = ["Python", "Django", "PostgreSQL", "Docker"]
        # Candidate has lowercase & different casing
        resume_skills = ["python", "DJANGO", "postgresql", "React"]

        matching, missing, score = compute_skill_overlap(job_skills, resume_skills)

        self.assertEqual(len(matching), 3)
        self.assertIn("Python", matching)
        self.assertIn("Django", matching)
        self.assertIn("PostgreSQL", matching)
        self.assertEqual(missing, ["Docker"])
        self.assertEqual(score, 75.0)

    def test_missing_resume_or_incomplete_parsed_data_graceful(self):
        from apps.applications.services.matching_engine import calculate_match_breakdown

        # 1. None resume
        res_none = calculate_match_breakdown(self.job, None)
        self.assertEqual(res_none["overall_score"], 0.0)
        self.assertEqual(res_none["matching_skills"], [])

        # 2. Empty raw_text
        class EmptyResume:
            raw_text = ""
            parsed_data = {}

        res_empty = calculate_match_breakdown(self.job, EmptyResume())
        self.assertEqual(res_empty["overall_score"], 0.0)
        self.assertIn("status", res_empty["breakdown"])
        self.assertEqual(res_empty["breakdown"]["status"], "UNREADABLE")

    def test_empty_job_description_and_skills(self):
        from apps.applications.services.matching_engine import calculate_match_breakdown

        empty_job = JobPosting(
            title="General Role",
            description="",
            required_skills=[],
            optional_skills=[],
            experience_level="ENTRY",
        )

        class SimpleResume:
            raw_text = "Junior developer with passion for software engineering. B.S. degree."
            parsed_data = {"skills": ["Python"], "education": ["B.S."]}

        result = calculate_match_breakdown(empty_job, SimpleResume())
        self.assertGreaterEqual(result["overall_score"], 0.0)
        self.assertLessEqual(result["overall_score"], 100.0)

    def test_deterministic_scoring(self):
        from apps.applications.services.matching_engine import calculate_match_breakdown

        class CandidateResume:
            raw_text = "Python and Django backend developer with 3 years of experience. B.S. in Computer Science."
            parsed_data = {"skills": ["Python", "Django"], "education": ["B.S."]}

        res1 = calculate_match_breakdown(self.job, CandidateResume())
        res2 = calculate_match_breakdown(self.job, CandidateResume())

        self.assertEqual(res1["overall_score"], res2["overall_score"])
        self.assertEqual(res1["skills_score"], res2["skills_score"])
        self.assertEqual(res1["similarity_score"], res2["similarity_score"])
        self.assertEqual(res1["matching_skills"], res2["matching_skills"])
        self.assertEqual(res1["missing_skills"], res2["missing_skills"])

    def test_automatic_matching_on_application_submission(self):
        self.client.force_authenticate(user=self.candidate_1)
        pdf_content = (
            "Gordon Freeman gordon@dev.io "
            "Senior Python Engineer with 6 years of experience in Django, PostgreSQL, Docker, and Redis. "
            "Ph.D. in Physics from MIT."
        )
        pdf_file = SimpleUploadedFile("gordon_resume.pdf", generate_test_pdf(pdf_content), content_type="application/pdf")

        response = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file, "cover_note": "Excited to apply for the Senior Python Engineer position."},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        app_id = response.data["id"]
        app = Application.objects.get(id=app_id)

        # Match result should have been automatically computed and saved
        self.assertTrue(hasattr(app, "match_result"))
        self.assertIsNotNone(app.match_result)
        self.assertGreater(app.match_result.overall_score, 50.0)
        self.assertIn("Python", app.match_result.matching_skills)

    def test_get_match_endpoint_permissions(self):
        # 1. Candidate 1 applies
        self.client.force_authenticate(user=self.candidate_1)
        pdf_file = SimpleUploadedFile(
            "resume.pdf",
            generate_test_pdf("Python Django developer with 4 years experience."),
            content_type="application/pdf",
        )
        app_res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )
        app_id = app_res.data["id"]

        match_url = reverse("applications-v1:application_match", kwargs={"id": app_id})

        # 2. Unauthenticated access is rejected
        self.client.force_authenticate(user=None)
        res_anon = self.client.get(match_url)
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 3. Candidate 1 (owner of application) can view match
        self.client.force_authenticate(user=self.candidate_1)
        res_cand1 = self.client.get(match_url)
        self.assertEqual(res_cand1.status_code, status.HTTP_200_OK)
        self.assertIn("overall_score", res_cand1.data)
        self.assertIn("breakdown", res_cand1.data)

        # 4. Candidate 2 cannot view Candidate 1's match (403 Forbidden)
        self.client.force_authenticate(user=self.candidate_2)
        res_cand2 = self.client.get(match_url)
        self.assertEqual(res_cand2.status_code, status.HTTP_403_FORBIDDEN)

        # 5. Recruiter A (owner of the job) can view match
        self.client.force_authenticate(user=self.recruiter_a)
        res_rec_a = self.client.get(match_url)
        self.assertEqual(res_rec_a.status_code, status.HTTP_200_OK)
        self.assertEqual(res_rec_a.data["candidate_name"], "Gordon Freeman")

        # 6. Recruiter B (does not own this job) cannot view match (403 Forbidden)
        self.client.force_authenticate(user=self.recruiter_b)
        res_rec_b = self.client.get(match_url)
        self.assertEqual(res_rec_b.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_recalculate_match_endpoint(self):
        # Apply
        self.client.force_authenticate(user=self.candidate_1)
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf("Python Django developer"), content_type="application/pdf")
        app_res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )
        app_id = app_res.data["id"]
        match_url = reverse("applications-v1:application_match", kwargs={"id": app_id})

        # Recruiter recalculates match
        self.client.force_authenticate(user=self.recruiter_a)
        recalc_res = self.client.post(match_url)
        self.assertEqual(recalc_res.status_code, status.HTTP_200_OK)
        self.assertIn("overall_score", recalc_res.data)

        # Unauthorized recruiter cannot recalculate
        self.client.force_authenticate(user=self.recruiter_b)
        forbidden_recalc = self.client.post(match_url)
        self.assertEqual(forbidden_recalc.status_code, status.HTTP_403_FORBIDDEN)

    def test_recruiter_applicant_list_sorting_by_match_score(self):
        # Candidate 1: High match (all skills)
        self.client.force_authenticate(user=self.candidate_1)
        high_match_pdf = SimpleUploadedFile(
            "high.pdf",
            generate_test_pdf("Senior engineer Python Django PostgreSQL Docker Redis Kubernetes AWS. Master degree."),
            content_type="application/pdf",
        )
        self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": high_match_pdf},
            format="multipart",
        )

        # Candidate 2: Low match (few skills)
        self.client.force_authenticate(user=self.candidate_2)
        low_match_pdf = SimpleUploadedFile(
            "low.pdf",
            generate_test_pdf("Junior designer with HTML and CSS."),
            content_type="application/pdf",
        )
        self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": low_match_pdf},
            format="multipart",
        )

        # Recruiter requests sorted by match_score descending
        self.client.force_authenticate(user=self.recruiter_a)
        sort_desc_res = self.client.get(
            reverse("applications-v1:job_applicants", kwargs={"id": self.job.id}) + "?ordering=-match_score"
        )
        self.assertEqual(sort_desc_res.status_code, status.HTTP_200_OK)
        results = sort_desc_res.data["results"]
        self.assertEqual(len(results), 2)
        self.assertGreaterEqual(results[0]["match_score"], results[1]["match_score"])

        # Recruiter requests sorted by match_score ascending
        sort_asc_res = self.client.get(
            reverse("applications-v1:job_applicants", kwargs={"id": self.job.id}) + "?ordering=match_score"
        )
        self.assertEqual(sort_asc_res.status_code, status.HTTP_200_OK)
        results_asc = sort_asc_res.data["results"]
        self.assertLessEqual(results_asc[0]["match_score"], results_asc[1]["match_score"])


class SecurityAndHardeningTests(APITestCase):
    """
    Test suite for Phase 6: Security Audit, Hardening & Defensive Edge Cases.
    """

    def setUp(self):
        # Recruiter
        self.recruiter = User.objects.create_user(
            email="sec_recruiter@company.com",
            password="Password123!",
            first_name="Sam",
            last_name="Recruiter",
            role=Role.RECRUITER,
            company_name="SecureCorp",
        )
        self.intruder_recruiter = User.objects.create_user(
            email="sec_intruder_rec@company.com",
            password="Password123!",
            first_name="Intruder",
            last_name="Recruiter",
            role=Role.RECRUITER,
            company_name="EvilCorp",
        )

        # Candidates
        self.candidate = User.objects.create_user(
            email="sec_candidate@dev.com",
            password="Password123!",
            first_name="Sarah",
            last_name="Dev",
            role=Role.CANDIDATE,
        )
        self.intruder_candidate = User.objects.create_user(
            email="sec_intruder_cand@dev.com",
            password="Password123!",
            first_name="Bad",
            last_name="Actor",
            role=Role.CANDIDATE,
        )

        # Active Job
        self.job = JobPosting.objects.create(
            recruiter=self.recruiter,
            title="Senior Security Architect",
            company_name="SecureCorp",
            location="Remote",
            location_type=LocationType.REMOTE,
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.SENIOR,
            description="Looking for Python and Django security engineer.",
            required_skills=["Python", "Django"],
            status=JobStatus.ACTIVE,
        )

    def test_secure_resume_download_candidate_and_recruiter(self):
        # 1. Candidate applies
        self.client.force_authenticate(user=self.candidate)
        pdf_file = SimpleUploadedFile(
            "sarah_resume.pdf",
            generate_test_pdf("Python Django Security Expert"),
            content_type="application/pdf",
        )
        app_res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )
        app_id = app_res.data["id"]
        download_url = reverse("applications-v1:resume_download", kwargs={"id": app_id})

        # 2. Candidate downloads own resume
        cand_dl_res = self.client.get(download_url)
        self.assertEqual(cand_dl_res.status_code, status.HTTP_200_OK)
        self.assertIn("attachment", cand_dl_res.get("Content-Disposition", ""))
        self.assertIn("sarah_resume.pdf", cand_dl_res.get("Content-Disposition", ""))

        # 3. Job owner recruiter downloads candidate resume
        self.client.force_authenticate(user=self.recruiter)
        rec_dl_res = self.client.get(download_url)
        self.assertEqual(rec_dl_res.status_code, status.HTTP_200_OK)

    def test_secure_resume_download_unauthorized_intruder_blocked(self):
        # 1. Candidate applies
        self.client.force_authenticate(user=self.candidate)
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf("Python dev"), content_type="application/pdf")
        app_res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )
        app_id = app_res.data["id"]
        download_url = reverse("applications-v1:resume_download", kwargs={"id": app_id})

        # 2. Unauthenticated user blocked
        self.client.force_authenticate(user=None)
        anon_res = self.client.get(download_url)
        self.assertEqual(anon_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 3. Unrelated candidate blocked
        self.client.force_authenticate(user=self.intruder_candidate)
        intruder_cand_res = self.client.get(download_url)
        self.assertEqual(intruder_cand_res.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Unrelated recruiter blocked
        self.client.force_authenticate(user=self.intruder_recruiter)
        intruder_rec_res = self.client.get(download_url)
        self.assertEqual(intruder_rec_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_resume_upload_rejected(self):
        self.client.force_authenticate(user=self.candidate)
        empty_file = SimpleUploadedFile("empty.pdf", b"", content_type="application/pdf")
        res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": empty_file},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", res.data)

    def test_spoofed_pdf_signature_rejected(self):
        self.client.force_authenticate(user=self.candidate)
        # File named .pdf but containing executable bytes instead of %PDF signature
        spoofed_file = SimpleUploadedFile("malicious.pdf", b"MZ\x90\x00NotAPdfBinaryContent", content_type="application/pdf")
        res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": spoofed_file},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("signature", str(res.data).lower())

    def test_unsupported_extension_rejected(self):
        self.client.force_authenticate(user=self.candidate)
        exe_file = SimpleUploadedFile("payload.exe", b"MZ\x90\x00BinaryContent", content_type="application/x-msdownload")
        res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": exe_file},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unsupported", str(res.data).lower())


    def test_cannot_withdraw_rejected_application(self):
        # 1. Candidate applies
        self.client.force_authenticate(user=self.candidate)
        pdf_file = SimpleUploadedFile("resume.pdf", generate_test_pdf("Python"), content_type="application/pdf")
        app_res = self.client.post(
            reverse("applications-v1:job_apply", kwargs={"id": self.job.id}),
            {"file": pdf_file},
            format="multipart",
        )
        app_id = app_res.data["id"]
        detail_url = reverse("applications-v1:application_detail", kwargs={"id": app_id})

        # 2. Recruiter rejects candidate
        self.client.force_authenticate(user=self.recruiter)
        reject_res = self.client.patch(detail_url, {"status": ApplicationStatus.REJECTED})
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)
        self.assertEqual(reject_res.data["status"], ApplicationStatus.REJECTED)

        # 3. Candidate attempts to withdraw a rejected application
        self.client.force_authenticate(user=self.candidate)
        withdraw_res = self.client.patch(detail_url, {"status": ApplicationStatus.WITHDRAWN})
        self.assertEqual(withdraw_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rejected", str(withdraw_res.data).lower())


