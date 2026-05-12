"""
ARGUS — Hardened Phishing Detection Rules Engine
Covers: urgency, authority, credential harvesting, financial fraud,
impersonation, domain spoofing, malicious infrastructure, and social engineering.
"""

# ── Scoring weights ──────────────────────────────────────────────────────────
URGENCY_SCORE    = 22
FINANCIAL_SCORE  = 28
DOMAIN_SCORE     = 35
PATTERN_SCORE    = 28
AUTH_SCORE       = 32
IMPERSON_SCORE   = 30
THREAT_SCORE     = 35

# ── Thresholds ───────────────────────────────────────────────────────────────
PHISHING_THRESHOLD   = 65
SUSPICIOUS_THRESHOLD = 35

# ── Urgency & Pressure Language ──────────────────────────────────────────────
URGENCY_KEYWORDS = [
    "urgent", "immediate action", "act now", "within 24 hours", "within 48 hours",
    "your account will be suspended", "account suspended", "account locked",
    "immediately", "as soon as possible", "asap", "last chance", "final notice",
    "limited time", "expires today", "expiring soon", "deadline",
    "action required", "response required", "reply immediately",
    "failure to respond", "will be terminated", "legal action",
    "your access will be revoked", "verify immediately", "confirm now",
]

# ── Authority & Impersonation Patterns ───────────────────────────────────────
AUTHORITY_KEYWORDS = [
    "ceo", "chief executive", "president", "vp of finance", "director",
    "it department", "help desk", "security team", "hr department",
    "payroll department", "accounts department", "legal department",
    "irs", "fbi", "interpol", "dhs", "federal bureau",
    "microsoft support", "google account team", "apple security",
    "amazon account", "paypal security", "bank security team",
    "university administration", "financial aid office", "registrar",
]

# ── Credential Harvesting Patterns ───────────────────────────────────────────
CREDENTIAL_PATTERNS = [
    "verify your account",
    "verify your identity",
    "confirm your identity",
    "update your password",
    "reset your password",
    "password reset",
    "password expiring",
    "your password has expired",
    "login credentials",
    "enter your credentials",
    "provide your username",
    "provide your password",
    "click here to login",
    "sign in to continue",
    "re-enter your information",
    "verify your email",
    "confirm your email address",
    "account verification",
    "unauthorized login attempt",
    "suspicious login detected",
    "unusual sign-in activity",
]

# ── Financial Fraud Patterns ──────────────────────────────────────────────────
FINANCIAL_PATTERNS = [
    "wire transfer",
    "bank transfer",
    "payment required",
    "invoice attached",
    "outstanding invoice",
    "pay now",
    "gift card",
    "purchase gift cards",
    "send gift cards",
    "bitcoin payment",
    "cryptocurrency payment",
    "refund processing",
    "tax refund",
    "unclaimed funds",
    "lottery winner",
    "inheritance",
    "advance fee",
    "processing fee",
    "transaction fee",
    "payroll update",
    "direct deposit change",
    "update bank details",
    "update payment information",
]

# ── Social Engineering Patterns ───────────────────────────────────────────────
PHISHING_PATTERNS = [
    "verify your account",
    "password reset",
    "unauthorized login",
    "bank details",
    "click here to",
    "login to your account",
    "your account has been",
    "update your information",
    "confirm your account",
    "we noticed unusual activity",
    "security alert",
    "we have detected",
    "your account may be compromised",
    "one-time password",
    "temporary password",
    "your session has expired",
    "dear valued customer",
    "dear account holder",
    "this is an automated message",
    "do not reply to this email",
    "noreply",
    "no-reply",
]

# ── Suspicious TLDs (high abuse rate) ────────────────────────────────────────
SUSPICIOUS_TLDS = [
    ".xyz", ".tk", ".ml", ".ga", ".cf", ".gq",
    ".top", ".work", ".click", ".win", ".racing",
    ".stream", ".bid", ".loan", ".review", ".trade",
    ".webcam", ".download", ".accountant", ".science",
    ".faith", ".country", ".party", ".cricket", ".date",
    ".men", ".ninja", ".icu", ".monster", ".cyou",
]

# ── Suspicious Domain Keywords (typosquatting, lookalikes) ───────────────────
SUSPICIOUS_DOMAINS = [
    ".xyz", ".ru", ".tk", ".top", ".club", ".pw",
    "paypa1", "paypai", "paypal-secure", "paypalsupport",
    "microsoft-support", "microsoftonline-verify",
    "google-security", "gmail-verify", "googleaccount",
    "apple-id-verify", "appleid-security",
    "amazon-security", "amazonprime-verify",
    "irs-refund", "tax-refund",
    "university-verify", "edu-portal", "campuslogin",
    "financialaid-verify", "studentportal-login",
    "harvard-secure", "mit-verify", "stanford-login",
]

# ── URL Shorteners (hide destination) ────────────────────────────────────────
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "cutt.ly", "rebrand.ly", "short.io",
    "tiny.cc", "bl.ink", "soo.gd", "snip.ly", "rb.gy",
}

# ── High-Risk Sender Domains ──────────────────────────────────────────────────
HIGH_RISK_SENDER_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "protonmail.com", "tutanota.com", "guerrillamail.com",
    "mailinator.com", "temp-mail.org", "10minutemail.com",
    "throwaway.email", "dispostable.com",
}

# ── Threat & Intimidation Language ────────────────────────────────────────────
THREAT_LANGUAGE = [
    "legal action will be taken",
    "your data will be published",
    "we have your files",
    "we have your passwords",
    "we have access to your camera",
    "we recorded you",
    "sextortion",
    "criminal charges",
    "arrest warrant",
    "you are under investigation",
    "court order",
    "law enforcement",
    "will report to authorities",
    "your computer is infected",
    "your device is compromised",
    "call immediately",
    "tech support",
]
