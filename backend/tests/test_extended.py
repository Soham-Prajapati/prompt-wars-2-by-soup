"""
Extended integration tests — Security headers, input validation, accountability
submit, chat fallback, quiz, bot webhooks, and live-proof depth.

Uses the shared `client` fixture from conftest.py.
"""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")

import app.main as main  # noqa: E402


# ── Security Headers ──────────────────────────────────────────────────────────

class TestSecurityHeaders:
    """Every response must include the hardened security headers."""

    def test_health_has_x_content_type_options(self, client):
        resp = client.get("/health")
        assert resp.headers.get("x-content-type-options") == "nosniff"

    def test_health_has_x_frame_options(self, client):
        resp = client.get("/health")
        assert resp.headers.get("x-frame-options") == "DENY"

    def test_health_has_strict_transport_security(self, client):
        resp = client.get("/health")
        hsts = resp.headers.get("strict-transport-security", "")
        assert "max-age=" in hsts
        assert "includeSubDomains" in hsts

    def test_health_has_referrer_policy(self, client):
        resp = client.get("/health")
        assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    def test_health_has_permissions_policy(self, client):
        resp = client.get("/health")
        pp = resp.headers.get("permissions-policy", "")
        assert "geolocation=()" in pp
        assert "camera=()" in pp

    def test_analytics_has_no_store_cache(self, client):
        resp = client.get("/analytics/summary")
        assert resp.headers.get("cache-control") == "no-store"


# ── Input Validation ─────────────────────────────────────────────────────────

class TestInputValidation:
    """Schemas must reject malformed input with 422."""

    def test_factcheck_rejects_empty_text(self, client):
        resp = client.post("/factcheck", json={"text": "", "language": "English"})
        assert resp.status_code == 422

    def test_factcheck_rejects_short_text(self, client):
        resp = client.post("/factcheck", json={"text": "hi", "language": "English"})
        assert resp.status_code == 422

    def test_analytics_event_rejects_empty_event_name(self, client):
        resp = client.post(
            "/analytics/event",
            json={"event_name": "", "session_id": "s", "page": "/", "props": {}},
        )
        assert resp.status_code == 422

    def test_analytics_event_rejects_bad_chars(self, client):
        resp = client.post(
            "/analytics/event",
            json={"event_name": "bad event!!", "session_id": "s", "page": "/", "props": {}},
        )
        assert resp.status_code == 422


# ── Accountability Submit ─────────────────────────────────────────────────────

class TestAccountabilitySubmit:
    """Submit endpoint must process form data and return assessment."""

    @patch("app.api.accountability.ai_service")
    @patch("app.api.accountability.pubsub_service")
    def test_submit_returns_submission_id(self, mock_pubsub, mock_ai, client):
        mock_ai.generate_content.return_value = '{"score": 75, "verdict": "APPROVE", "reason": "plausible"}'
        mock_pubsub.publish_event.return_value = None

        resp = client.post(
            "/accountability/submit",
            data={
                "claim_text": "Smart cities project has not been completed as promised by the government",
                "party": "BJP",
                "category": "Infrastructure",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "submission_id" in body
        assert body["status"] == "pending_review"
        assert body["ai_assessment"] is not None

    @patch("app.api.accountability.ai_service")
    @patch("app.api.accountability.pubsub_service")
    def test_submit_rejects_too_short_claim(self, mock_pubsub, mock_ai, client):
        resp = client.post(
            "/accountability/submit",
            data={"claim_text": "short", "party": "BJP"},
        )
        assert resp.status_code == 422

    @patch("app.api.accountability.ai_service")
    @patch("app.api.accountability.pubsub_service")
    def test_submit_stores_in_memory_reports(self, mock_pubsub, mock_ai, client):
        mock_ai.generate_content.return_value = '{"score": 50, "verdict": "REVIEW", "reason": "needs review"}'
        mock_pubsub.publish_event.return_value = None

        client.post(
            "/accountability/submit",
            data={
                "claim_text": "Farm loan waiver promise was not fulfilled by the state government",
                "party": "INC",
                "category": "Economy",
            },
        )
        reports = client.get("/accountability/reports").json()
        assert reports["total"] >= 1


# ── Chat Fallback ─────────────────────────────────────────────────────────────

class TestChatEndpoint:
    """Chat endpoint must stream SSE even when AI is unavailable."""

    def test_chat_returns_stream_response(self, client):
        resp = client.post(
            "/chat",
            json={
                "query": "How do I register to vote?",
                "language": "English",
                "constituency": "Varanasi",
                "expertise_level": "beginner",
                "conversation_history": [],
            },
        )
        # Streaming endpoint returns 200 with event-stream content type
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers.get("content-type", "")

    def test_chat_rejects_empty_query(self, client):
        resp = client.post(
            "/chat",
            json={
                "query": "",
                "language": "English",
                "constituency": "Test",
                "expertise_level": "beginner",
                "conversation_history": [],
            },
        )
        assert resp.status_code == 422


# ── Quiz Endpoint ─────────────────────────────────────────────────────────────

class TestQuizEndpoint:
    """Quiz must return structured questions with answers."""

    def test_quiz_returns_questions(self, client):
        resp = client.get("/quiz")
        assert resp.status_code == 200
        body = resp.json()
        assert "questions" in body
        assert len(body["questions"]) >= 3

    def test_quiz_questions_have_structure(self, client):
        resp = client.get("/quiz")
        for q in resp.json()["questions"]:
            assert "question" in q
            assert "options" in q
            assert "correct" in q
            assert len(q["options"]) == 4


# ── Bot Webhooks ──────────────────────────────────────────────────────────────

class TestBotWebhooks:
    """Telegram and WhatsApp webhook endpoints."""

    @patch("app.api.bots.ai_service")
    @patch("app.api.bots.pubsub_service")
    def test_telegram_webhook_processes_message(self, mock_pubsub, mock_ai, client):
        mock_ai.generate_content.return_value = "Hello citizen!"
        mock_pubsub.publish_event.return_value = None

        resp = client.post(
            "/webhook/telegram",
            json={
                "update_id": 12345,
                "message": {
                    "chat": {"id": 67890},
                    "text": "How do I vote?",
                },
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

    def test_telegram_webhook_ignores_empty(self, client):
        resp = client.post(
            "/webhook/telegram",
            json={"update_id": 99999, "message": {}},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "ignored"

    def test_whatsapp_webhook_ignores_empty_entries(self, client):
        resp = client.post(
            "/webhook/whatsapp",
            json={"entry": []},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "ignored"


# ── Live Proof Endpoint ───────────────────────────────────────────────────────

class TestLiveProof:
    """Live proof endpoint must enumerate all GCP services."""

    def test_live_proof_has_services_list(self, client):
        resp = client.get("/google-services/live-proof")
        assert resp.status_code == 200
        body = resp.json()
        assert "services" in body
        assert "services_count" in body
        assert body["services_count"] >= 7

    def test_live_proof_has_status(self, client):
        resp = client.get("/google-services/live-proof")
        body = resp.json()
        assert body["status"] in ("operational", "degraded")

    def test_live_proof_services_have_evidence(self, client):
        resp = client.get("/google-services/live-proof")
        for svc in resp.json()["services"]:
            assert "name" in svc
            assert "status" in svc
            assert "evidence" in svc


# ── Promises Filtering ────────────────────────────────────────────────────────

class TestPromisesFiltering:
    """Accountability promises support party and category filtering."""

    def test_promises_filter_by_party(self, client):
        resp = client.get("/accountability/promises?party=BJP")
        assert resp.status_code == 200
        for p in resp.json()["promises"]:
            assert p["party"] == "BJP"

    def test_promises_filter_by_category(self, client):
        resp = client.get("/accountability/promises?category=Infrastructure")
        assert resp.status_code == 200
        for p in resp.json()["promises"]:
            assert p["category"] == "Infrastructure"
