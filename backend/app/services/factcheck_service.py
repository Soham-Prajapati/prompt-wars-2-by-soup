"""
Fact-Check Service — Gemini-powered claim verification against ECI knowledge base.

Extracts the fact-checking business logic from the controller layer
so that it can be tested, reused, and maintained independently.
"""
import json
import logging
import re
from typing import Any, Dict, List, Optional

from app.knowledge_base import knowledge_base
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

# Default sources when AI model is unavailable or parsing fails.
_DEFAULT_SOURCES: List[str] = ["ECI Official Website", "PIB", "Factcheck.in"]


def verify_claim(text: str, language: str = "English") -> Dict[str, Any]:
    """Verify a claim using Gemini AI and the ECI knowledge base.

    Args:
        text: The claim to fact-check (pre-validated for length).
        language: Target response language.

    Returns:
        Dict containing ``overall_verdict``, ``confidence``,
        ``explanation``, ``sources_consulted``, and ``language``.
    """
    fallback: Dict[str, Any] = {
        "overall_verdict": "UNVERIFIABLE",
        "confidence": 0,
        "sources_consulted": list(_DEFAULT_SOURCES),
        "explanation": "AI model unavailable. Please check GCP configuration.",
        "language": language,
    }

    if not ai_service.model:
        return fallback

    context, sources = knowledge_base.get_context(text, top_k=3)

    prompt = _build_prompt(text, language, context)

    try:
        response_text: str = ai_service.generate_content(prompt)
        result: Optional[Dict[str, Any]] = _parse_json_response(response_text)
        if result:
            result.setdefault("sources_consulted", sources or _DEFAULT_SOURCES)
            result["language"] = language
            return result
    except Exception as exc:
        logger.error("Fact-check error: %s", exc)

    fallback["sources_consulted"] = sources or fallback["sources_consulted"]
    return fallback


def _build_prompt(text: str, language: str, context: str) -> str:
    """Construct the Gemini fact-check prompt.

    Args:
        text: Claim text.
        language: Target language for the explanation.
        context: Retrieved ECI knowledge context.

    Returns:
        Formatted prompt string.
    """
    return (
        "You are an election fact-checker for India. Evaluate this claim:\n\n"
        f"CLAIM: {text}\n"
        f"LANGUAGE: {language}\n"
        f"CONTEXT: {context or 'No specific context found.'}\n\n"
        "Respond in JSON only:\n"
        "{\n"
        '  "overall_verdict": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIABLE",\n'
        '  "confidence": <0-100>,\n'
        f'  "explanation": "<brief explanation in {language}>",\n'
        '  "sources_consulted": ["<source1>", "<source2>"]\n'
        "}"
    )


def _parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    """Extract the first JSON object from a raw LLM response.

    Args:
        text: Raw model output that may contain markdown fences.

    Returns:
        Parsed dict if valid JSON found, else ``None``.
    """
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            logger.warning("Failed to parse fact-check JSON: %s", text[:200])
    return None
