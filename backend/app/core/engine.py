"""
UniShield AI — Core Analysis Engine
"""

from app.services.detector import analyze_email
from app.services.ai_router import AIRouter
from app.core.prompts import REASONING_PROMPT
from app.core.logging import logger


def run_analysis(email_text: str, provider: str, api_key: str) -> dict:
    """
    Runs the full analysis pipeline: rule-based detector + AI explanation.
    """
    logger.info(f"Starting analysis for provider: {provider}")

    # 1. Rule-based detection
    score, label, reasons = analyze_email(email_text)
    logger.info(f"Rule-based analysis complete. Score: {score}, Label: {label}")

    # 2. AI Reasoning
    router = AIRouter(provider, api_key)

    prompt = REASONING_PROMPT.format(
        email_text=email_text[:1000],
        reasons=", ".join(reasons) if reasons else "None",
        score=score,
    )

    explanation = router.generate(prompt)
    logger.info("AI reasoning complete.")

    return {
        "score": score,
        "label": label,
        "reasons": reasons,
        "explanation": explanation,
    }
