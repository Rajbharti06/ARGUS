"""
ARGUS — Simulation Engine
Provides preloaded attack scenarios for live demo.
"""

import random
from typing import Dict
from fastapi import APIRouter

router = APIRouter()

FAKE_EMAILS = {
    "scholarship": {
        "content": "URGENT! You've been selected for a $5,000 scholarship. To claim, click: http://university-awards.xyz/claim-now. This offer expires today!",
        "sender": "awards@university-grants.xyz",
        "subject": "URGENT: You won a $5,000 scholarship — claim NOW",
    },
    "admission": {
        "content": "Your admission status to the Graduate Program has been updated. Log in immediately: http://192.168.1.45/login-portal. Failure to act will result in application withdrawal.",
        "sender": "admissions@grad-portal-secure.net",
        "subject": "FINAL NOTICE: Graduate Application Status Update",
    },
    "professor": {
        "content": "Hi, this is your Professor. I'm in a meeting and need you to purchase three $100 Amazon gift cards for a study. I'll reimburse you later. Send codes to this email.",
        "sender": "prof.williams.dept@gmail.com",
        "subject": "Urgent Favor Needed",
    },
    "it_alert": {
        "content": "Security Alert: Unauthorized login detected from Russia. Your account is locked. Verify identity here: http://bit.ly/uni-secure-verify",
        "sender": "security-noreply@it-university-portal.com",
        "subject": "CRITICAL: Unauthorized access detected on your account",
    },
}


@router.get("/emails")
def get_emails() -> Dict[str, dict]:
    return FAKE_EMAILS


@router.get("/random")
def simulate_random():
    key = random.choice(list(FAKE_EMAILS.keys()))
    return FAKE_EMAILS[key]


@router.get("/{attack_type}")
def simulate(attack_type: str):
    return FAKE_EMAILS.get(attack_type, FAKE_EMAILS["it_alert"])
