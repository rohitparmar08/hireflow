"""
Production settings for HireFlow backend.
Enforces strict security headers, secret key validation, and HTTPS configuration.
"""

import os
from django.core.exceptions import ImproperlyConfigured
from .base import *  # noqa: F403, F401

DEBUG = False

# Validate production SECRET_KEY
secret_key_env = os.getenv("DJANGO_SECRET_KEY")
if not secret_key_env or secret_key_env.startswith("hireflow-insecure-dev-key"):
    raise ImproperlyConfigured(
        "A secure, unique DJANGO_SECRET_KEY environment variable must be set in production mode."
    )
SECRET_KEY = secret_key_env
SIMPLE_JWT["SIGNING_KEY"] = SECRET_KEY  # noqa: F405

# Validate ALLOWED_HOSTS
raw_hosts = os.getenv("DJANGO_ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [h.strip() for h in raw_hosts.split(",") if h.strip()]
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS environment variable must be configured in production mode."
    )

# Security headers & SSL/HTTPS configuration
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# SSL redirect is configurable for environments behind SSL-terminating reverse proxies (e.g. Nginx, Cloudflare)
SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "False").lower() in ("true", "1")
SESSION_COOKIE_SECURE = os.getenv("DJANGO_SESSION_COOKIE_SECURE", "True").lower() in ("true", "1")
CSRF_COOKIE_SECURE = os.getenv("DJANGO_CSRF_COOKIE_SECURE", "True").lower() in ("true", "1")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if SECURE_SSL_REDIRECT:
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000"))  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# In production, restrict DRF renderers to JSON only (disables browsable API)
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
]
