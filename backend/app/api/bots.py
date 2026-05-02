"""
Bot Webhooks API — Telegram and WhatsApp bot integration endpoints.

Receives webhook payloads from messaging platforms, processes citizen queries
through Gemini AI, and publishes replies via Pub/Sub for async delivery.
"""
import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

from app.services.ai_service import ai_service
from app.services.pubsub_service import pubsub_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhook/telegram")
async def telegram_webhook(request: Request) -> Dict[str, str]:
    """Process incoming Telegram bot messages.

    Receives a Telegram Update object, extracts the message text,
    generates an AI response, and queues the reply via Pub/Sub.
    """
    try:
        body: Dict[str, Any] = await request.json()
        logger.info("Received Telegram update: %s", body.get("update_id"))

        message = body.get("message", {})
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")

        if not chat_id or not text:
            return {"status": "ignored", "reason": "No text or chat_id"}

        prompt = (
            f"A citizen on Telegram asked: '{text}'. "
            "Keep the response under 500 characters, use emojis, "
            "and sound like a friendly civic guide."
        )
        ai_response = ai_service.generate_content(prompt)

        pubsub_service.publish_event("telegram_reply", {
            "chat_id": chat_id,
            "text": ai_response,
        })

        return {"status": "success", "message": "Reply queued via Pub/Sub"}
    except Exception as e:
        logger.error("Telegram webhook failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request) -> Dict[str, str]:
    """Process incoming WhatsApp Business API messages.

    Parses the WhatsApp webhook payload (entries → changes → messages),
    generates an AI response, and queues the reply via Pub/Sub.
    """
    try:
        body: Dict[str, Any] = await request.json()

        entries = body.get("entry", [])
        if not entries:
            return {"status": "ignored"}

        changes = entries[0].get("changes", [])
        if not changes:
            return {"status": "ignored"}

        messages = changes[0].get("value", {}).get("messages", [])
        if not messages:
            return {"status": "ignored"}

        msg = messages[0]
        from_number: str = msg.get("from", "")
        text: str = msg.get("text", {}).get("body", "")

        prompt = (
            f"A citizen on WhatsApp asked: '{text}'. "
            "Keep the response under 300 characters, use WhatsApp formatting "
            "like *bold*, and sound like a friendly civic guide."
        )
        ai_response = ai_service.generate_content(prompt)

        pubsub_service.publish_event("whatsapp_reply", {
            "phone_number": from_number,
            "text": ai_response,
        })

        return {"status": "success", "message": "WhatsApp reply queued"}
    except Exception as e:
        logger.error("WhatsApp webhook failed: %s", e)
        return {"status": "error"}
