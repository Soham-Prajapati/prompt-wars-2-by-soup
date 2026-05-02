import logging
from fastapi import APIRouter, Request, HTTPException
from app.services.ai_service import ai_service
from app.services.pubsub_service import pubsub_service
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

class TelegramWebhook(BaseModel):
    update_id: int
    message: dict = None

@router.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """
    Webhook endpoint for Telegram Bot.
    Receives messages from citizens, processes them via Gemini, and replies natively.
    """
    try:
        body = await request.json()
        logger.info(f"Received Telegram update: {body.get('update_id')}")
        
        message = body.get("message", {})
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")

        if not chat_id or not text:
            return {"status": "ignored", "reason": "No text or chat_id"}

        # 1. AI Processing
        prompt = f"A citizen on Telegram asked: '{text}'. Keep the response under 500 characters, use emojis, and sound like a friendly civic guide."
        ai_response = ai_service.generate_content(prompt)

        # 2. Async publishing for the actual reply (simulated)
        pubsub_service.publish_event("telegram_reply", {
            "chat_id": chat_id,
            "text": ai_response
        })

        return {"status": "success", "message": "Reply queued via Pub/Sub"}
    except Exception as e:
        logger.error(f"Telegram webhook failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Webhook endpoint for WhatsApp Business API.
    """
    try:
        body = await request.json()
        # Simplified WhatsApp parsing
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
        from_number = msg.get("from")
        text = msg.get("text", {}).get("body", "")

        prompt = f"A citizen on WhatsApp asked: '{text}'. Keep the response under 300 characters, use WhatsApp formatting like *bold*, and sound like a friendly civic guide."
        ai_response = ai_service.generate_content(prompt)

        pubsub_service.publish_event("whatsapp_reply", {
            "phone_number": from_number,
            "text": ai_response
        })

        return {"status": "success", "message": "WhatsApp reply queued"}
    except Exception as e:
        logger.error(f"WhatsApp webhook failed: {e}")
        return {"status": "error"}
