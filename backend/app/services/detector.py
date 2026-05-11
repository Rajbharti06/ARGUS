"""
UniShield AI — Defense Engine (Detector)
"""

import re
from typing import List, Tuple

from . import rules


def analyze_email(email_text: str) -> Tuple[int, str, List[str]]:
    """Analyzes email text and returns a score, label, and reasons."""
    score = 0
    reasons = []
    email_lower = email_text.lower()

    # 1. Urgency detection
    if any(keyword in email_lower for keyword in rules.URGENCY_KEYWORDS):
        score += rules.URGENCY_SCORE
        reasons.append("Urgency language detected")

    # 2. Financial pattern check
    if re.search(r"\$\d+", email_text) or "payment" in email_lower:
        score += rules.FINANCIAL_SCORE
        reasons.append("Money/Payment request detected")

    # 3. Suspicious domain check
    for domain in rules.SUSPICIOUS_DOMAINS:
        if domain in email_text:
            score += rules.DOMAIN_SCORE
            reasons.append(f"Suspicious domain detected: {domain}")
            break

    # 4. Common phishing patterns
    for pattern in rules.PHISHING_PATTERNS:
        if pattern in email_lower:
            score += rules.PATTERN_SCORE
            reasons.append(f"Phishing pattern detected: '{pattern}'")
            break

    # 5. Labeling
    if score >= rules.PHISHING_THRESHOLD:
        label = "Phishing"
    elif score >= rules.SUSPICIOUS_THRESHOLD:
        label = "Suspicious"
    else:
        label = "Safe"

    return score, label, reasons
