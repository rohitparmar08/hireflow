"""
Production settings for HireFlow backend.
"""

import os
from .base import *  # noqa: F403, F401

DEBUG = False

raw_hosts = os.getenv("DJANGO_ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [h.strip() for h in raw_hosts.split(",") if h.strip()]

# Production security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Cookie security (enabled when running behind HTTPS in production)
if os.getenv("DJANGO_SECURE_SSL_REDIRECT", "False").lower() in ("true", "1"):
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# In production, restrict DRF renderers to JSON only (disable browsable API)
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
]
