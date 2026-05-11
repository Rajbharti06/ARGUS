"""
UniShield AI — Detection Rules
"""

# Scoring constants
URGENCY_SCORE = 20
FINANCIAL_SCORE = 25
DOMAIN_SCORE = 30
PATTERN_SCORE = 25

# Thresholds
PHISHING_THRESHOLD = 70
SUSPICIOUS_THRESHOLD = 40

# Rule definitions
SUSPICIOUS_DOMAINS = [".xyz", ".ru", ".tk", ".top", ".club"]

PHISHING_PATTERNS = [
    "verify your account",
    "password reset",
    "unauthorized login",
    "bank details",
]

URGENCY_KEYWORDS = ["urgent", "immediate action"]
