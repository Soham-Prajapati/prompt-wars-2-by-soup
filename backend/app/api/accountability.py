"""
Accountability API — Jawaab Do: citizen accountability reporting with AI verification.
Integrates: Cloud Storage (evidence images), Vision AI (safety), Gemini (assessment), Pub/Sub (workflow).
"""
import json
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.services.ai_service import ai_service
from app.services.pubsub_service import pubsub_service
from app.services.storage_service import storage_service
from app.services.vision_service import vision_service

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory store for submitted reports (survives within a container instance)
_submitted_reports: List[Dict[str, Any]] = []

# File upload constraints
MAX_IMAGE_BYTES: int = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES: frozenset = frozenset({
    "image/jpeg", "image/png", "image/webp", "image/gif"
})

MANIFESTO_PROMISES: List[Dict[str, Any]] = [
    {
        "id": "p001", "party": "BJP", "year": 2019, "category": "Infrastructure",
        "promise": "Build 100 smart cities across India",
    },
    {
        "id": "p002", "party": "INC", "year": 2019, "category": "Economy",
        "promise": "NYAY scheme: Rs 72,000 per year to the poorest 20% families",
    },
    {
        "id": "p003", "party": "BJP", "year": 2019, "category": "Agriculture",
        "promise": "Double farmers income by 2022",
    },
    {
        "id": "p004", "party": "BJP", "year": 2024, "category": "Infrastructure",
        "promise": "Build 2 crore houses under PM Awas Yojana",
    },
    {
        "id": "p005", "party": "INC", "year": 2024, "category": "Economy",
        "promise": "Guaranteed legal right to minimum support price for farmers",
    },
    {
        "id": "p006", "party": "BJP", "year": 2024, "category": "Welfare",
        "promise": "Free ration to 80 crore beneficiaries for 5 years",
    },
]


@router.get("/accountability/promises")
async def get_promises(q: str = "", party: str = "", category: str = "") -> Dict[str, Any]:
    """Search manifesto promises with optional text, party, and category filters."""
    results = MANIFESTO_PROMISES
    if q:
        q_lower = q.lower()
        results = [
            p for p in results
            if q_lower in p["promise"].lower()
            or q_lower in p["party"].lower()
            or q_lower in p["category"].lower()
        ]
    if party:
        results = [p for p in results if p["party"].lower() == party.lower()]
    if category:
        results = [p for p in results if p["category"].lower() == category.lower()]
    return {"promises": results, "total": len(results)}


@router.get("/accountability/reports")
async def get_reports() -> Dict[str, Any]:
    """Return submitted accountability reports (in-memory, processed via Pub/Sub)."""
    return {
        "reports": _submitted_reports[-20:],  # Return latest 20 submissions
        "total": len(_submitted_reports),
        "message": "Reports are processed asynchronously via Pub/Sub.",
    }


@router.post("/accountability/submit")
async def submit_report(
    request: Request,
    claim_text: str = Form(..., min_length=10, max_length=5000),
    promise_id: str = Form("", max_length=50),
    party: str = Form(..., min_length=1, max_length=200),
    constituency: str = Form("", max_length=200),
    category: str = Form("Infrastructure", max_length=100),
    image: Optional[UploadFile] = File(None),
) -> Dict[str, Any]:
    """Submit an accountability report with optional image evidence.

    Workflow:
    1. Validate & upload image to Cloud Storage
    2. Run Vision AI safety analysis on image
    3. Score claim plausibility with Gemini
    4. Publish event to Pub/Sub for async processing
    """
    submission_id = str(uuid.uuid4())
    image_url: Optional[str] = None
    vision_labels: List[str] = []
    ai_assessment: Optional[Dict[str, Any]] = None

    # ── 1. Image validation & upload (Cloud Storage + Vision AI) ─────────────
    if image:
        # MIME type check
        content_type = image.content_type or ""
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{content_type}'. Allowed: {sorted(ALLOWED_CONTENT_TYPES)}",
            )

        content: bytes = await image.read()

        # File size check
        if len(content) > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Image too large ({len(content) // 1024} KB). Maximum allowed: {MAX_IMAGE_BYTES // 1024} KB",
            )

        image_url = storage_service.upload_file(content, f"{submission_id}.jpg")

        vision_result = vision_service.analyze_image(content)
        if not vision_result.get("is_safe", True):
            raise HTTPException(
                status_code=400,
                detail="Image rejected: inappropriate content detected by Vision AI",
            )

        vision_labels = vision_result.get("labels", [])
        logger.info("[%s] Image processed: %s (labels: %s)", submission_id, image_url, vision_labels)

    # ── 2. AI Verification (Gemini) ───────────────────────────────────────────
    verification_prompt = (
        f"Review this accountability report and assess its plausibility.\n"
        f"Claim: {claim_text}\n"
        f"Party: {party}\n"
        f"Category: {category}\n"
        f"Image Labels: {vision_labels if vision_labels else 'None'}\n\n"
        'Respond in JSON only: {"score": <0-100>, "verdict": "APPROVE" | "REVIEW" | "REJECT", "reason": "<brief reason>"}'
    )

    try:
        ai_text = ai_service.generate_content(verification_prompt)
        json_match = re.search(r'\{.*?\}', ai_text, re.DOTALL)
        if json_match:
            ai_assessment = json.loads(json_match.group())
        else:
            ai_assessment = {"score": 50, "verdict": "REVIEW", "reason": "Could not parse AI response."}
    except Exception as e:
        logger.warning("AI verification failed: %s", e)
        ai_assessment = {"score": 50, "verdict": "REVIEW", "reason": "AI service unavailable."}

    # ── 3. Async workflow via Pub/Sub ─────────────────────────────────────────
    event_data: Dict[str, Any] = {
        "submission_id": submission_id,
        "claim_text": claim_text[:500],  # truncate for event payload
        "party": party,
        "category": category,
        "image_url": image_url,
        "ai_score": ai_assessment.get("score", 0) if ai_assessment else 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    pubsub_service.publish_event("accountability_report_submitted", event_data)

    # ── 4. Store in-memory for /accountability/reports ────────────────────────
    _submitted_reports.append({
        **event_data,
        "constituency": constituency,
        "promise_id": promise_id,
        "ai_verdict": ai_assessment.get("verdict", "REVIEW") if ai_assessment else "REVIEW",
    })

    return {
        "submission_id": submission_id,
        "status": "pending_review",
        "image_url": image_url,
        "ai_assessment": ai_assessment,
        "message": "Report submitted. Background verification triggered via Pub/Sub.",
    }
