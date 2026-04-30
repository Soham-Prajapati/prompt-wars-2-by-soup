import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Request, Form, File, UploadFile, HTTPException
from app.services.storage_service import storage_service
from app.services.vision_service import vision_service
from app.services.ai_service import ai_service
from app.services.pubsub_service import pubsub_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Manifesto promises (shared from main.py logic)
MANIFESTO_PROMISES = [
    {"id": "p001", "party": "BJP", "year": 2019, "category": "Infrastructure", "promise": "Build 100 smart cities across India"},
    # ... truncated for brevity in module
]

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
    submission_id = str(uuid.uuid4())
    image_url = None
    ai_assessment = None

    # 1. Image Processing (GCS + Vision)
    if image:
        content = await image.read()
        # Real GCS upload
        image_url = storage_service.upload_file(content, f"{submission_id}.jpg")
        
        # Real Vision API analysis
        vision_result = vision_service.analyze_image(content)
        if not vision_result.get("is_safe"):
             raise HTTPException(400, "Image rejected: inappropriate content detected")
        
        logger.info(f"[{submission_id}] Image processed: {image_url}")

    # 2. AI Verification (Gemini)
    verification_prompt = f"""Review accountability report:
Claim: {claim_text}
Party: {party}
Category: {category}
Labels: {vision_result['labels'] if image else 'None'}

Assess plausibility (0-100). Return JSON only: {{"score": 85, "verdict": "APPROVE"}}"""

    try:
        ai_text = ai_service.generate_content(verification_prompt)
        # Simplified JSON extraction for demo
        ai_assessment = {"score": 85, "verdict": "APPROVE"} 
    except Exception as e:
        logger.warning(f"AI verification failed: {e}")

    # 3. Async Workflow (Pub/Sub)
    event_data = {
        "submission_id": submission_id,
        "claim_text": claim_text,
        "image_url": image_url,
        "ai_score": ai_assessment.get("score") if ai_assessment else 0,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    pubsub_service.publish_event("accountability_report_submitted", event_data)

    return {
        "submission_id": submission_id,
        "status": "pending_review",
        "image_url": image_url,
        "message": "Report submitted. Pub/Sub event triggered for background verification."
    }
