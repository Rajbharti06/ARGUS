"""
ARGUS — Hardened Phishing Detection Engine
Multi-vector pattern matching with weighted scoring.
"""

import re
from typing import List, Tuple
from . import rules


def analyze_email(email_text: str) -> Tuple[int, str, List[str]]:
    """
    Multi-vector email/message analysis.
    Returns: (score 0-100, label, [reasons])
    """
    score   = 0
    reasons = []
    text_l  = email_text.lower()

    # 1. Urgency / pressure language
    urgency_hits = [kw for kw in rules.URGENCY_KEYWORDS if kw in text_l]
    if urgency_hits:
        score += rules.URGENCY_SCORE
        reasons.append(f"Urgency manipulation: {urgency_hits[0]!r}")

    # 2. Authority / impersonation keywords
    auth_hits = [kw for kw in rules.AUTHORITY_KEYWORDS if kw in text_l]
    if auth_hits:
        score += rules.AUTH_SCORE
        reasons.append(f"Authority impersonation: {auth_hits[0]!r}")

    # 3. Credential harvesting patterns
    cred_hits = [p for p in rules.CREDENTIAL_PATTERNS if p in text_l]
    if cred_hits:
        score += rules.PATTERN_SCORE
        reasons.append(f"Credential harvesting indicator: {cred_hits[0]!r}")

    # 4. Financial fraud patterns
    fin_hits = [p for p in rules.FINANCIAL_PATTERNS if p in text_l]
    if fin_hits:
        score += rules.FINANCIAL_SCORE
        reasons.append(f"Financial fraud pattern: {fin_hits[0]!r}")

    # 5. Generic phishing patterns
    phish_hits = [p for p in rules.PHISHING_PATTERNS if p in text_l]
    if phish_hits and not cred_hits:  # avoid double-counting
        score += rules.PATTERN_SCORE // 2
        reasons.append(f"Phishing pattern: {phish_hits[0]!r}")

    # 6. Suspicious TLD in URLs
    urls = re.findall(r"https?://[^\s<>\"]+", email_text)
    for url in urls:
        tld = "." + url.split("?")[0].rstrip("/").rsplit(".", 1)[-1].lower()
        if tld in rules.SUSPICIOUS_TLDS:
            score += rules.DOMAIN_SCORE
            reasons.append(f"Suspicious TLD in URL: {tld}")
            break
        # URL shortener
        host = url.split("/")[2].lower()
        if host in rules.URL_SHORTENERS:
            score += 20
            reasons.append(f"URL shortener detected: {host} (hides destination)")
            break

    # 7. Suspicious domain keywords in body
    for domain in rules.SUSPICIOUS_DOMAINS:
        if domain in text_l:
            score += rules.DOMAIN_SCORE
            reasons.append(f"Lookalike/spoof domain detected: {domain!r}")
            break

    # 8. Threat / intimidation language
    threat_hits = [t for t in rules.THREAT_LANGUAGE if t in text_l]
    if threat_hits:
        score += rules.THREAT_SCORE
        reasons.append(f"Threat / intimidation language: {threat_hits[0]!r}")

    # 9. Free email sender for "official" communication
    sender_match = re.search(r"from[:\s]+[\w.+-]+@([\w.-]+)", text_l)
    if sender_match:
        sender_domain = sender_match.group(1).lower()
        if sender_domain in {d.lower() for d in rules.HIGH_RISK_SENDER_DOMAINS}:
            score += 18
            reasons.append(f"Free email provider as official sender: @{sender_domain}")

    # 10. Inline monetary amounts ($, €, £)
    if re.search(r"[\$€£]\s*\d[\d,]*", email_text):
        score += rules.FINANCIAL_SCORE // 2
        reasons.append("Monetary amount detected in message body")

    score = min(score, 100)

    if score >= rules.PHISHING_THRESHOLD:
        label = "Phishing"
    elif score >= rules.SUSPICIOUS_THRESHOLD:
        label = "Suspicious"
    else:
        label = "Safe"

    return score, label, reasons
