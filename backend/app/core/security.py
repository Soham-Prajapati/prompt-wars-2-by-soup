"""
Security Middleware — HTTP security headers and request tracing.

Injected as FastAPI middleware to enforce:
- Content-Security-Policy (CSP) with frame-ancestors 'none'
- HSTS with one-year max-age
- X-Request-ID tracing on every response
- Cache-Control differentiation per route
"""
import uuid
from typing import Any

from fastapi import Request


# ── Content-Security-Policy value ────────────────────────────────────────────

CSP_HEADER: str = "; ".join([
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
])


async def add_security_headers(request: Request, call_next: Any) -> Any:
    """Inject security and tracing headers on every response.

    Headers applied:
        - ``X-Content-Type-Options``: nosniff
        - ``X-Frame-Options``: DENY
        - ``X-XSS-Protection``: 1; mode=block
        - ``Referrer-Policy``: strict-origin-when-cross-origin
        - ``Permissions-Policy``: disables geolocation, mic, camera
        - ``Strict-Transport-Security``: 1-year HSTS
        - ``Content-Security-Policy``: restrictive CSP
        - ``Cache-Control``: no-store for analytics, no-cache otherwise
        - ``X-Request-ID``: echoes client-provided or generates UUID
    """
    response = await call_next(request)

    # ── Security headers ──────────────────────────────────────────────────
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = CSP_HEADER

    # ── Cache control ─────────────────────────────────────────────────────
    response.headers["Cache-Control"] = (
        "no-store" if request.url.path.startswith("/analytics") else "no-cache"
    )

    # ── Request tracing ───────────────────────────────────────────────────
    request_id: str = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    response.headers["X-Request-ID"] = request_id

    return response
