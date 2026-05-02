"""
Tests for security hardening — CSP, X-Request-ID, CORS, JSON 404, OpenAPI.

Uses the shared `client` fixture from conftest.py.
"""
import os
import sys
import uuid
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")

import app.main as main  # noqa: E402


class TestContentSecurityPolicy:
    """CSP header must be present on every response."""

    def test_csp_header_present(self, client):
        resp = client.get("/health")
        csp = resp.headers.get("content-security-policy", "")
        assert "default-src" in csp

    def test_csp_blocks_frame_ancestors(self, client):
        resp = client.get("/health")
        csp = resp.headers.get("content-security-policy", "")
        assert "frame-ancestors 'none'" in csp

    def test_csp_allows_fonts_googleapis(self, client):
        resp = client.get("/")
        csp = resp.headers.get("content-security-policy", "")
        assert "fonts.googleapis.com" in csp


class TestRequestTracing:
    """X-Request-ID must be present on every response."""

    def test_request_id_header_present(self, client):
        resp = client.get("/health")
        request_id = resp.headers.get("x-request-id", "")
        assert len(request_id) > 0

    def test_request_id_is_valid_uuid(self, client):
        resp = client.get("/health")
        request_id = resp.headers.get("x-request-id", "")
        # Should not raise ValueError
        uuid.UUID(request_id)

    def test_request_id_echo_when_provided(self, client):
        custom_id = "trace-12345-abcde"
        resp = client.get("/health", headers={"X-Request-ID": custom_id})
        assert resp.headers.get("x-request-id") == custom_id


class TestJsonErrorResponses:
    """Unknown routes must return JSON, not HTML."""

    def test_404_returns_json(self, client):
        resp = client.get("/totally-nonexistent-endpoint-xyz")
        assert resp.status_code == 404
        body = resp.json()
        assert "detail" in body

    def test_404_includes_path(self, client):
        resp = client.get("/unknown/route/here")
        body = resp.json()
        assert "path" in body


class TestOpenAPIEndpoints:
    """OpenAPI schema and docs must be accessible."""

    def test_openapi_json_available(self, client):
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert "info" in schema
        assert schema["info"]["title"] == "ElectIQ API"
        assert schema["info"]["version"] == "2.0.0"

    def test_docs_endpoint_available(self, client):
        resp = client.get("/docs")
        assert resp.status_code == 200

    def test_openapi_schema_has_paths(self, client):
        resp = client.get("/openapi.json")
        schema = resp.json()
        assert "/health" in schema["paths"]
        assert "/factcheck" in schema["paths"]
        assert "/chat" in schema["paths"]


class TestVersionConsistency:
    """Version must be consistent across root and OpenAPI schema."""

    def test_root_returns_version_2(self, client):
        resp = client.get("/")
        assert resp.json()["version"] == "2.0.0"

    def test_openapi_matches_root(self, client):
        root_version = client.get("/").json()["version"]
        schema_version = client.get("/openapi.json").json()["info"]["version"]
        assert root_version == schema_version
