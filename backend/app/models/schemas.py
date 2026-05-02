"""
Pydantic Request Schemas — strict input validation for all ElectIQ API endpoints.

Every public endpoint deserialises its body through one of these models.
Field constraints (``min_length``, ``max_length``, ``pattern``) enforce
server-side validation before any business logic executes.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatRequest(BaseModel):
    """Schema for the ``POST /chat`` conversational AI endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "query": "How does EVM voting work in India?",
                    "language": "English",
                    "constituency": "Mumbai North",
                    "expertise_level": "beginner",
                    "conversation_history": [],
                }
            ]
        }
    )

    query: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="English", max_length=50)
    constituency: str = Field(default="Your Constituency", max_length=200)
    expertise_level: str = Field(default="beginner", pattern="^(beginner|intermediate|expert)$")
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list, max_length=20)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        """Strip leading/trailing whitespace from the user query."""
        return v.strip()


class FactCheckRequest(BaseModel):
    """Schema for the ``POST /factcheck`` claim verification endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "text": "EVMs can be hacked via Bluetooth",
                    "language": "English",
                }
            ]
        }
    )

    text: str = Field(..., min_length=5, max_length=3000)
    language: str = Field(default="English", max_length=50)

    @field_validator("text")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Strip leading/trailing whitespace from the claim text."""
        return v.strip()


class ConstituencyRequest(BaseModel):
    """Schema for constituency lookup requests."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"name": "Varanasi", "state": "Uttar Pradesh"}]
        }
    )

    name: str = Field(..., min_length=1, max_length=200)
    state: str = Field(default="Maharashtra", max_length=100)


class AnalyticsEvent(BaseModel):
    """Schema for the ``POST /analytics/event`` telemetry endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "event_name": "page_view",
                    "session_id": "sess_abc123",
                    "page": "/chat",
                    "props": {"source": "navbar"},
                }
            ]
        }
    )

    event_name: str = Field(..., min_length=1, max_length=100, pattern="^[a-zA-Z0-9_]+$")
    session_id: str = Field(..., min_length=1, max_length=100)
    page: str = Field(default="/", max_length=500)
    props: Dict[str, Any] = Field(default_factory=dict)


class AccountabilityReport(BaseModel):
    """Schema for the ``POST /accountability/submit`` report endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "claim_text": "Smart city project not started in my area despite 2019 promise",
                    "promise_id": "p001",
                    "party": "BJP",
                    "constituency": "Pune",
                    "category": "Infrastructure",
                }
            ]
        }
    )

    claim_text: str = Field(..., min_length=10, max_length=5000)
    promise_id: str = Field(default="", max_length=50)
    party: str = Field(..., min_length=1, max_length=200)
    constituency: str = Field(default="", max_length=200)
    category: str = Field(default="Infrastructure", max_length=100)
