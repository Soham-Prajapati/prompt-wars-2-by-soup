from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="English", max_length=50)
    constituency: str = Field(default="Your Constituency", max_length=200)
    expertise_level: str = Field(default="beginner", pattern="^(beginner|intermediate|expert)$")
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list, max_length=20)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        return v.strip()


class FactCheckRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=3000)
    language: str = Field(default="English", max_length=50)

    @field_validator("text")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        return v.strip()


class ConstituencyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    state: str = Field(default="Maharashtra", max_length=100)


class AnalyticsEvent(BaseModel):
    event_name: str = Field(..., min_length=1, max_length=100, pattern="^[a-zA-Z0-9_]+$")
    session_id: str = Field(..., min_length=1, max_length=100)
    page: str = Field(default="/", max_length=500)
    props: Dict[str, Any] = Field(default_factory=dict)


class AccountabilityReport(BaseModel):
    claim_text: str = Field(..., min_length=10, max_length=5000)
    promise_id: str = Field(default="", max_length=50)
    party: str = Field(..., min_length=1, max_length=200)
    constituency: str = Field(default="", max_length=200)
    category: str = Field(default="Infrastructure", max_length=100)
