import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.services.ai_service import ai_service
from app.services.translation_service import translation_service
from app.knowledge_base import knowledge_base

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat")
async def chat_stream(request: Request, body: ChatRequest):
    context, sources = knowledge_base.get_context(body.query, top_k=5)

    lang_instruction = f"Speak naturally and fluently in {body.language}." if body.language != "English" else "Speak naturally and fluently in English."
    level_map = {
        "beginner": "Explain this like you're talking to a friend who is voting for the first time. Keep it simple and relatable.",
        "intermediate": "Give a clear, well-structured explanation with some context.",
        "expert": "Provide a deep, nuanced constitutional and legal breakdown."
    }
    level_note = level_map.get(body.expertise_level, level_map["beginner"])

    prompt = f"""You are ElectIQ, but don't act like a generic AI bot. You are a passionate, friendly, and deeply knowledgeable local civic guide in India. 
You love democracy and want to empower the user. 
{lang_instruction}
{level_note}

RELEVANT ECI FACTS:
{context if context else "Use your general knowledge about Indian elections."}

USER ASKED: {body.query}
THEIR CONSTITUENCY: {body.constituency}

Guidelines for a BANGER response:
- Talk like a real person. Use a warm, engaging, and encouraging tone.
- Drop the robotic "As an AI..." or "Here are the facts..." intros. Just dive straight into the good stuff.
- Keep it punchy and easy to read. Use formatting (bolding, short lists) to make it skimmable.
- If they ask about their constituency, make it feel local and relevant.
- At the end, ask exactly one thought-provoking or helpful follow-up question to keep the conversation going.
- Cite your sources naturally in the flow of conversation (e.g., "According to the ECI...")."""

    async def generate():
        try:
            history = []
            for turn in body.conversation_history[-6:]:
                role = turn.get("role", "user")
                text = turn.get("text", turn.get("content", ""))
                if text:
                    history.append({"role": role, "parts": [text]})

            response = ai_service.generate_chat_response(prompt, history=history)

            if isinstance(response, str): # Fallback/Error
                final_text = translation_service.translate_text(response, body.language)
                yield f"data: {json.dumps({'type': 'text', 'content': final_text})}\n\n"
            else:
                for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'type': 'text', 'content': chunk.text})}\n\n"

            if sources:
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

            yield "data: {\"type\": \"done\"}\n\n"
        except Exception as e:
            logger.error(f"Chat error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
