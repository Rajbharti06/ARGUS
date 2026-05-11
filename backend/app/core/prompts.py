"""
UniShield AI — AI Reasoner Prompts
"""

REASONING_PROMPT = """
Analyze this email for phishing risks:
---
Email: {email_text}
---
Reasons detected: {reasons}
Risk Score: {score}/100

Explain clearly and concisely (3-5 sentences) for a university student.
Focus on educating the reader about the specific tactics used.
"""
