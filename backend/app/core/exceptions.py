"""
Custom Exception Hierarchy — structured error handling for ElectIQ.

All application-specific exceptions inherit from ``ElectIQError`` so
callers can catch the entire family or individual subtypes.  Each
exception carries an HTTP ``status_code`` and a machine-readable
``error_code`` for consistent JSON error responses.
"""
from typing import Any, Dict, Optional


class ElectIQError(Exception):
    """Base exception for all ElectIQ application errors."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, detail: str = "An internal error occurred.", context: Optional[Dict[str, Any]] = None) -> None:
        self.detail = detail
        self.context = context or {}
        super().__init__(self.detail)


class AIServiceUnavailableError(ElectIQError):
    """Raised when the Gemini AI model is not configured or unreachable."""

    status_code = 503
    error_code = "AI_UNAVAILABLE"

    def __init__(self, detail: str = "AI service is currently unavailable.") -> None:
        super().__init__(detail)


class BudgetExceededError(ElectIQError):
    """Raised when the request budget cap has been reached."""

    status_code = 429
    error_code = "BUDGET_EXCEEDED"

    def __init__(self, detail: str = "Request budget exhausted. Please contact the administrator.") -> None:
        super().__init__(detail)


class ValidationError(ElectIQError):
    """Raised for business-logic validation failures (not schema validation)."""

    status_code = 422
    error_code = "VALIDATION_ERROR"


class UnsupportedMediaError(ElectIQError):
    """Raised when an uploaded file has an unsupported MIME type."""

    status_code = 415
    error_code = "UNSUPPORTED_MEDIA"


class PayloadTooLargeError(ElectIQError):
    """Raised when an uploaded file exceeds the size limit."""

    status_code = 413
    error_code = "PAYLOAD_TOO_LARGE"
