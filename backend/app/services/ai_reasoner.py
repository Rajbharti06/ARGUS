"""
UniShield AI — AI Reasoning Engine
Uses LLM (OpenAI) for generating human-readable phishing explanations.
Falls back to template-based reasoning when API is unavailable.
"""

import os
from typing import Optional


from app.services.ai_router import route_ai_request


def explain_email(
    email: str,
    reasons: list[str],
    score: int = 0,
    provider: str = "openai",
    api_key: str = None,
) -> str:
    """
    Generate an AI-powered explanation of why an email is suspicious/phishing.
    Uses the multi-provider AI router, with a smart fallback.

    Args:
        email: The email content to explain.
        reasons: List of detected threat indicators.
        score: The risk score (0-100).
        provider: The requested AI provider.
        api_key: The user's API key.

    Returns:
        A human-readable explanation string.
    """
    try:
        reasons_text = (
            "\n".join(f"- {r}" for r in reasons)
            if reasons
            else "No specific indicators"
        )
        prompt = f"""You are a cybersecurity expert advising university students and staff.

Analyze this email and explain clearly why it is suspicious or could be phishing.
Keep your explanation concise (3-5 sentences), professional, and easy to understand.
Focus on educating the reader about the specific tactics used.

Email content:
---
{email[:1500]}
---

Detected threat indicators:
{reasons_text}

Risk Score: {score}/100

Provide a clear, actionable explanation."""

        return route_ai_request(prompt, provider, api_key)
    except Exception as e:
        print(f"AI Router fallback triggered: {str(e)}")
        return _fallback_explain(email, reasons, score)


def _fallback_explain(email: str, reasons: list[str], score: int) -> str:
    """
    Generate a template-based explanation when OpenAI is unavailable.
    Still provides meaningful, context-aware analysis.
    """
    email_lower = email.lower()

    explanations = []

    # Analyze detected patterns
    if any("urgency" in r.lower() or "pressure" in r.lower() for r in reasons):
        explanations.append(
            "This email uses urgency tactics to pressure you into acting quickly "
            "without thinking critically — a classic phishing technique."
        )

    if any("credential" in r.lower() or "password" in r.lower() for r in reasons):
        explanations.append(
            "The email attempts to harvest your credentials by asking for personal "
            "information. Legitimate institutions never request passwords via email."
        )

    if any(
        "link" in r.lower() or "domain" in r.lower() or "url" in r.lower()
        for r in reasons
    ):
        explanations.append(
            "Suspicious links were detected that don't belong to verified educational "
            "or institutional domains. These could redirect to credential-stealing pages."
        )

    if any("impersonat" in r.lower() or "authority" in r.lower() for r in reasons):
        explanations.append(
            "The sender impersonates an authority figure (IT department, administration) "
            "to establish false trust — a common social engineering tactic."
        )

    if any(
        "payment" in r.lower() or "money" in r.lower() or "fee" in r.lower()
        for r in reasons
    ):
        explanations.append(
            "This email requests money or payment — a major red flag. Legitimate "
            "university communications handle fees through official portals, not email."
        )

    if any(
        "format" in r.lower() or "grammar" in r.lower() or "caps" in r.lower()
        for r in reasons
    ):
        explanations.append(
            "The email shows formatting anomalies (excessive capitals, punctuation) "
            "commonly seen in mass phishing campaigns."
        )

    if not explanations:
        if score >= 50:
            explanations.append(
                "This email exhibits multiple characteristics commonly found in phishing "
                "attempts targeting university communities. Exercise extreme caution."
            )
        elif score >= 25:
            explanations.append(
                "This email shows some suspicious patterns. While it may be legitimate, "
                "we recommend verifying the sender through official channels before responding."
            )
        else:
            explanations.append(
                "This email appears relatively safe based on our analysis. No significant "
                "phishing indicators were detected."
            )

    # Add contextual advice
    if score >= 50:
        explanations.append(
            "⚡ Recommendation: Do not interact with this email. Report it to your "
            "university's IT security team immediately."
        )

    return " ".join(explanations)
