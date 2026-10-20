from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class CoreApiTests(APITestCase):
    """
    Test suite for Core API v1 endpoints (HealthCheck & ApiRoot).
    """

    def test_api_root_endpoint(self):
        url = reverse("core-v1:api-root")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("version", response.data)
        self.assertEqual(response.data["version"], "1.0.0")
        self.assertIn("endpoints", response.data)

    def test_health_check_endpoint(self):
        url = reverse("core-v1:health-check")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertEqual(response.data["database"], "healthy")
        self.assertEqual(response.data["service"], "HireFlow API")
