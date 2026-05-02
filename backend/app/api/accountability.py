import json
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.services.ai_service import ai_service
from app.services.pubsub_service import pubsub_service
from app.services.storage_service import storage_service
from app.services.vision_service import vision_service

router = APIRouter()
logger = logging.getLogger(__name__)

MANIFESTO_PROMISES = [
    {"id": "p001", "party": "BJP", "year": 2019, "category": "Infrastructure",
     "promise": "Build 100 smart cities across India"},
    {"id": "p002", "party": "INC", "year": 2019, "category": "Economy",
     "promise": "NYAY scheme: Rs 72,000 per year to the poorest 20% families"},
    {"id": "p003", "party": "BJP", "year": 2019, "category": "Agriculture",
     "promise": "Double farmers income by 2022"},
    {"id": "p004", "party": "BJP", "year": 2024, "category": "Infrastructure",
     "promise": "Build 2 crore houses under PM Awas Yojana"},
]


@router.get("/accountability/promises")
async def get_promises(q: str = ""):
    """Search manifesto promises."""
    results = MANIFESTO_PROMISES
    if q:
        q_lower = q.lower()
        results = [
            p for p in MANIFESTO_PROMISES
            if q_lower in p["promise"].lower()
            or q_lower in p["party"].lower()
            or q_lower in p["category"].lower()
        ]
    return {"promises": results, "total": len(results)}


@router.get("/accountability/reports")
async def get_reports():
    """Return submitted accountability reports (Pub/Sub sourced)."""
    return {"reports": [], "message": "Reports are processed asynchronously via Pub/Sub."}


@router.post("/accountability/submit")
async def submit_report(
    request: Request,
    claim_text: str = Form(...),
    promise_id: str = Form(""),
    party: str = Form(...),
    constituency: str = Form(""),
    category: str = Form("Infrastructure"),
    image: Optional[UploadFile] = File(None),
):
    """Submit an accountability report with optional image evidence."""
    submission_id = str(uuid.uuid4())
    image_url: Optional[str] = None
    vision_labels: list = []
    ai_assessment: Optional[dict] = None

    # 1. Image Processing (GCS + Vision AI)
    if image:
        content = await image.read()
        image_url = storage_service.upload_file(content, f"{submission_id}.jpg")

        vision_result = vision_service.analyze_image(content)
        if not vision_result.get("is_safe", True):
            raise HTTPException(status_code=400, detail="Image rejected: inappropriate content detected")

        vision_labels = vision_result.get("labels", [])
        logger.info(f"[{submission_id}] Image processed: {image_url}")

    # 2. AI Verification (Gemini)
    verification_prompt = f"""Review this accountability report and assess its plausibility.
Claim: {claim_text}
Party: {party}
Category: {category}
Image Labels: {vision_labels if vision_labels else 'None'}

Respond in JSON only: {{"score": <0-100>, "verdict": "APPROVE" | "REVIEW" | "REJECT", "reason": "<brief reason>"}}"""

    try:
        ai_text = ai_service.generate_content(verification_prompt)
        json_match = re.search(r'\{.*?\}', ai_text, re.DOTALL)
        if json_match:
            ai_assessment = json.loads(json_match.group())
        else:
            ai_assessment = {"score": 50, "verdict": "REVIEW", "reason": "Could not parse AI response."}
    except Exception as e:
        logger.warning(f"AI verification failed: {e}")
        ai_assessment = {"score": 50, "verdict": "REVIEW", "reason": "AI service unavailable."}

    # 3. Async Workflow via Pub/Sub
    event_data = {
        "submission_id": submission_id,
        "claim_text": claim_text,
        "image_url": image_url,
        "ai_score": ai_assessment.get("score", 0) if ai_assessment else 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    pubsub_service.publish_event("accountability_report_submitted", event_data)

    return {
        "submission_id": submission_id,
        "status": "pending_review",
        "image_url": image_url,
        "ai_assessment": ai_assessment,
        "message": "Report submitted. Background verification triggered via Pub/Sub.",
    }
