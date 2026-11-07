"""
Local development settings for HireFlow backend.
"""

from .base import *  # noqa: F403, F401

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "testserver"]

# Local development and the test suite should not trip the rate limits.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_RATES": {"auth": "10000/min", "apply": "10000/hour"},
}

# Ensure media directory exists during local development
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
