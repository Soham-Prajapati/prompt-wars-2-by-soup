"""
ElectIQ FastAPI Backend — AI-powered India Election Intelligence Platform
GCP Project: prompt-wars-2-by-soup
"""
import json
import logging
import os
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import accountability, analytics, bots, chat, civic_data
from app.knowledge_base import knowledge_base
from app.models import schemas
from app.services.ai_service import ai_service
from app.services.analytics_service import analytics_service
from app.services.gcp_service import gcp_service
from app.services.usage_limiter import usage_limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Module-level state (shared with test harness) ────────────────────────────
# _analytics_events is a live reference to the in-memory list inside analytics_service.
# Tests call main._analytics_events.clear() between runs.
_analytics_events: list = analytics_service._events_mem

# Gemini model handle — tests set this to None to simulate unavailability.
gemini_model = ai_service.model


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_gemini_key() -> str:
    """Return the active Gemini API key (env preferred, then Secret Manager)."""
    env_key = os.environ.get("GEMINI_API_KEY")
    if env_key:
        return env_key
    return gcp_service.get_secret("GEMINI_API_KEY") or ""


# ── App Lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global gemini_model
    gemini_model = ai_service.model
    logger.info(f"ElectIQ API starting — GCP project: {gcp_service.project_id}")
    yield
    logger.info("ElectIQ API shutting down")


# ── FastAPI App ───────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ElectIQ API",
    description="AI-powered India Election Intelligence Platform",
    version="1.2.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.environ.get("CORS_ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(chat.router, tags=["AI"])
app.include_router(accountability.router, tags=["Civic"])
app.include_router(analytics.router, tags=["Ops"])
app.include_router(bots.router, tags=["Bots"])
app.include_router(civic_data.router, tags=["Civic Data"])


# ── Core Endpoints ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "product": "ElectIQ",
        "status": "Production-Ready",
        "version": "1.2.0",
        "google_services": [
            "Secret Manager", "BigQuery", "Pub/Sub",
            "Cloud Storage", "Vision AI", "Gemini 2.5 Flash",
        ],
        "architecture": "Service-Oriented Modular Architecture",
    }


@app.get("/health")
async def health():
    """Health check endpoint — returns AI and GCP readiness status."""
    bq_table = (
        f"{gcp_service.project_id}.electiq_analytics.events"
        if gcp_service.project_id
        else "not_configured"
    )
    return {
        "status": "healthy",
        "project": gcp_service.project_id,
        "google_project": gcp_service.project_id,
        "ai_ready": gemini_model is not None,
        "analytics_bigquery_table": bq_table,
    }


@app.get("/google-services/status")
async def google_services_status():
    """Live status of all integrated Google Cloud services."""
    try:
        import google.generativeai  # noqa: F401
        sdk_installed = True
    except ImportError:
        sdk_installed = False

    project_ok = gcp_service.project_id is not None
    return {
        "gemini": {
            "sdk_installed": sdk_installed,
            "configured": gemini_model is not None,
            "model": "gemini-2.5-flash",
        },
        "bigquery": {
            "configured": project_ok,
            "dataset": "electiq_analytics",
            "table": "events",
        },
        "secret_manager": {
            "configured": project_ok,
        },
        "cloud_storage": {
            "configured": project_ok,
            "bucket": os.environ.get("GCS_BUCKET", "electiq-reports"),
        },
        "vision_ai": {
            "configured": project_ok,
        },
        "pubsub": {
            "configured": project_ok,
        },
    }


@app.get("/budget/status")
async def get_budget_status():
    """Current AI request budget usage."""
    return usage_limiter.get_status()


@app.post("/analytics/event")
@limiter.limit("60/minute")
async def track_event(request: Request, body: schemas.AnalyticsEvent):
    """Record a frontend analytics event."""
    analytics_service.write_event(body.event_name, body.session_id, body.page, body.props)
    return {"ok": True}


@app.get("/analytics/summary")
async def analytics_summary():
    """Analytics event summary (in-memory first, BigQuery fallback)."""
    return analytics_service.get_summary()


@app.post("/factcheck")
async def factcheck(body: schemas.FactCheckRequest):
    """Fact-check a claim using Gemini + ECI knowledge base."""
    fallback = {
        "overall_verdict": "UNVERIFIABLE",
        "confidence": 0,
        "sources_consulted": ["ECI Official Website", "PIB", "Factcheck.in"],
        "explanation": "AI model unavailable. Please check GCP configuration.",
        "language": body.language,
    }

    if not gemini_model:
        return fallback

    context, sources = knowledge_base.get_context(body.text, top_k=3)
    prompt = f"""You are an election fact-checker for India. Evaluate this claim:

CLAIM: {body.text}
LANGUAGE: {body.language}
CONTEXT: {context or "No specific context found."}

Respond in JSON only:
{{
  "overall_verdict": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIABLE",
  "confidence": <0-100>,
  "explanation": "<brief explanation in {body.language}>",
  "sources_consulted": ["<source1>", "<source2>"]
}}"""

    try:
        response_text = ai_service.generate_content(prompt)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            result.setdefault("sources_consulted", sources or ["ECI Official Website"])
            result["language"] = body.language
            return result
    except Exception as e:
        logger.error(f"Fact-check error: {e}")

    fallback["sources_consulted"] = sources or fallback["sources_consulted"]
    return fallback
