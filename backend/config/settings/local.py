"""
Local development settings for HireFlow backend.
"""

from .base import *  # noqa: F403, F401

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "testserver"]

# Ensure media directory exists during local development
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
