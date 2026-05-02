"""
Application Configuration — Centralised settings via pydantic-settings.

All environment variables are loaded once at import time and validated
through Pydantic's ``BaseSettings``.  Modules import ``settings`` to
access typed, validated configuration rather than calling ``os.environ``
directly.
"""
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Typed, validated application settings sourced from environment variables."""

    # ── Google Cloud ────────────────────────────────────────────────────────
    google_cloud_project: str = ""
    gemini_api_key: str = ""
    gcp_region: str = "us-central1"
    gcs_bucket: str = "electiq-reports"

    # ── BigQuery ────────────────────────────────────────────────────────────
    bigquery_dataset: str = "electiq_analytics"
    bigquery_table: str = "events"

    # ── CORS ────────────────────────────────────────────────────────────────
    cors_allow_origins: str = "*"

    # ── Application ─────────────────────────────────────────────────────────
    app_version: str = "2.0.0"
    app_title: str = "ElectIQ API"
    app_description: str = "AI-powered India Election Intelligence Platform"
    log_level: str = "INFO"

    # ── Rate Limiting ───────────────────────────────────────────────────────
    analytics_rate_limit: str = "60/minute"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_allow_origins.split(",")]

    @property
    def is_wildcard_cors(self) -> bool:
        """Check whether CORS is set to wildcard (disables credentials)."""
        return self.cors_origins_list == ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
