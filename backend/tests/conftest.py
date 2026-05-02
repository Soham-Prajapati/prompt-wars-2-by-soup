"""
Shared pytest fixtures for the ElectIQ test suite.
"""
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure the backend root is on the Python path
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Set test env vars before any app module import
os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")

import app.main as main  # noqa: E402


@pytest.fixture()
def client():
    """Provide a TestClient with clean analytics state for each test."""
    main._analytics_events.clear()
    main.gemini_model = main.ai_service.model
    with TestClient(main.app) as c:
        yield c
    # Cleanup after test
    main._analytics_events.clear()
    main.gemini_model = main.ai_service.model
