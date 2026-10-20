import uuid
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Role

User = get_user_model()


class AuthenticationAndRBACTests(APITestCase):
    """
    Test suite for HireFlow Phase 2 Authentication & RBAC.
    """

    def setUp(self):
        self.register_url = reverse("auth-v1:register")
        self.login_url = reverse("auth-v1:login")
        self.refresh_url = reverse("auth-v1:token_refresh")
        self.logout_url = reverse("auth-v1:logout")
        self.me_url = reverse("auth-v1:current_user")
        self.profile_url = reverse("auth-v1:update_profile")

        self.candidate_data = {
            "email": "candidate@example.com",
            "first_name": "Jane",
            "last_name": "Doe",
            "role": Role.CANDIDATE,
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "headline": "Full-Stack Developer",
        }

        self.recruiter_data = {
            "email": "recruiter@acme.com",
            "first_name": "John",
            "last_name": "Smith",
            "role": Role.RECRUITER,
            "company_name": "Acme Talent Corp",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "headline": "Lead Technical Recruiter",
        }

    def test_candidate_registration_success(self):
        response = self.client.post(self.register_url, self.candidate_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], "candidate@example.com")
        self.assertEqual(response.data["user"]["role"], Role.CANDIDATE)

        # Verify password is encrypted and flags are safe
        user = User.objects.get(email="candidate@example.com")
        self.assertTrue(user.check_password("StrongPassword123!"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_recruiter_registration_success(self):
        response = self.client.post(self.register_url, self.recruiter_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["company_name"], "Acme Talent Corp")
        self.assertEqual(response.data["user"]["role"], Role.RECRUITER)

    def test_recruiter_registration_requires_company_name(self):
        invalid_recruiter = self.recruiter_data.copy()
        invalid_recruiter["company_name"] = ""
        response = self.client.post(self.register_url, invalid_recruiter, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("company_name", response.data)

    def test_duplicate_email_registration_fails(self):
        self.client.post(self.register_url, self.candidate_data, format="json")
        # Try registering same email with different case
        duplicate_data = self.candidate_data.copy()
        duplicate_data["email"] = "CANDIDATE@example.com"
        response = self.client.post(self.register_url, duplicate_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_password_mismatch_registration_fails(self):
        mismatched_data = self.candidate_data.copy()
        mismatched_data["password_confirm"] = "DifferentPassword123!"
        response = self.client.post(self.register_url, mismatched_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_weak_password_registration_fails(self):
        weak_data = self.candidate_data.copy()
        weak_data["password"] = "123"
        weak_data["password_confirm"] = "123"
        response = self.client.post(self.register_url, weak_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        self.client.post(self.register_url, self.candidate_data, format="json")
        login_payload = {
            "email": "candidate@example.com",
            "password": "StrongPassword123!",
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "candidate@example.com")
        self.assertEqual(response.data["user"]["role"], Role.CANDIDATE)

    def test_login_invalid_credentials_fails(self):
        self.client.post(self.register_url, self.candidate_data, format="json")
        login_payload = {
            "email": "candidate@example.com",
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_me_endpoint_authenticated(self):
        reg_response = self.client.post(self.register_url, self.candidate_data, format="json")
        access_token = reg_response.data["tokens"]["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "candidate@example.com")
        self.assertEqual(response.data["role"], Role.CANDIDATE)

    def test_current_user_me_endpoint_unauthenticated(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_update_and_prevent_role_escalation(self):
        reg_response = self.client.post(self.register_url, self.candidate_data, format="json")
        access_token = reg_response.data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Attempt to escalate role to RECRUITER or modify is_staff
        update_payload = {
            "first_name": "Janet",
            "headline": "Lead Python Architect",
            "role": Role.RECRUITER,
            "is_staff": True,
        }
        response = self.client.patch(self.profile_url, update_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Legit update without role escalation
        legit_payload = {
            "first_name": "Janet",
            "headline": "Lead Python Architect",
        }
        response = self.client.patch(self.profile_url, legit_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["first_name"], "Janet")
        self.assertEqual(response.data["user"]["headline"], "Lead Python Architect")

        # Confirm role in database remains CANDIDATE
        user = User.objects.get(email="candidate@example.com")
        self.assertEqual(user.role, Role.CANDIDATE)
        self.assertFalse(user.is_staff)

    def test_token_refresh_and_logout_blacklisting(self):
        reg_response = self.client.post(self.register_url, self.candidate_data, format="json")
        initial_refresh = reg_response.data["tokens"]["refresh"]
        access_token = reg_response.data["tokens"]["access"]

        # 1. Refresh token to obtain new access token and rotated refresh token
        refresh_response = self.client.post(
            self.refresh_url,
            {"refresh": initial_refresh},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)
        self.assertIn("refresh", refresh_response.data)
        rotated_refresh = refresh_response.data["refresh"]

        # Because ROTATE_REFRESH_TOKENS & BLACKLIST_AFTER_ROTATION are True,
        # initial_refresh is now already blacklisted. Reusing it must fail.
        old_token_reuse = self.client.post(
            self.refresh_url,
            {"refresh": initial_refresh},
            format="json",
        )
        self.assertEqual(old_token_reuse.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Test explicit logout blacklists the currently active rotated refresh token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        logout_response = self.client.post(
            self.logout_url,
            {"refresh": rotated_refresh},
            format="json",
        )
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # 3. Attempting to use the blacklisted rotated refresh token must now fail
        reuse_response = self.client.post(
            self.refresh_url,
            {"refresh": rotated_refresh},
            format="json",
        )
        self.assertEqual(reuse_response.status_code, status.HTTP_401_UNAUTHORIZED)
