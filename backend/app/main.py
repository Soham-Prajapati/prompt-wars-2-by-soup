"""
ElectIQ FastAPI Backend — AI-powered India Election Intelligence Platform.

Entrypoint for the production API deployed on Google Cloud Run.
This module is intentionally thin: it wires together routers, middleware,
and configuration — all business logic lives in ``app.api`` and ``app.services``.

GCP Project: prompt-wars-2-by-soup
"""
import logging
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import accountability, bots, chat, civic_data, core
from app.core.config import settings
from app.core.exceptions import ElectIQError
from app.core.security import add_security_headers
from app.services.gcp_service import gcp_service

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger(__name__)


# ── App Lifecycle ─────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialise shared state on startup; clean up on shutdown."""
    logger.info(
        "ElectIQ API v%s starting — GCP project: %s",
        settings.app_version,
        gcp_service.project_id,
    )
    yield
    logger.info("ElectIQ API shutting down")


# ── FastAPI App ───────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.app_title,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=not settings.is_wildcard_cors,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


# ── Middleware ────────────────────────────────────────────────────────────────

app.middleware("http")(add_security_headers)


# ── Exception Handlers ───────────────────────────────────────────────────────


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Any) -> JSONResponse:
    """Return JSON (not HTML) for unknown routes."""
    return JSONResponse(
        status_code=404,
        content={"detail": "Not found", "path": str(request.url.path)},
    )


@app.exception_handler(ElectIQError)
async def electiq_error_handler(request: Request, exc: ElectIQError) -> JSONResponse:
    """Handle custom ElectIQ application errors with structured JSON."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "detail": exc.detail,
            "path": str(request.url.path),
        },
    )


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(core.router)
app.include_router(chat.router, tags=["AI"])
app.include_router(accountability.router, tags=["Civic"])
app.include_router(bots.router, tags=["Bots"])
app.include_router(civic_data.router, tags=["Civic Data"])
