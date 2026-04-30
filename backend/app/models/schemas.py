from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    query: str
    language: str = "English"
    constituency: str = "Your Constituency"
    expertise_level: str = "beginner"
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)

class FactCheckRequest(BaseModel):
    text: str
    language: str = "English"

class ConstituencyRequest(BaseModel):
    name: str
    state: str = "Maharashtra"

class AnalyticsEvent(BaseModel):
    event_name: str
    session_id: str
    page: str = "/"
    props: Dict[str, Any] = Field(default_factory=dict)

class AccountabilityReport(BaseModel):
    claim_text: str
    promise_id: str = ""
    party: str
    constituency: str = ""
    category: str = "Infrastructure"
