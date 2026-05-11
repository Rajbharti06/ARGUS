"""
UniShield AI — API Schemas
"""

from pydantic import BaseModel
from typing import List


class ScanRequest(BaseModel):
    email: str
    provider: str = "openai"
    api_key: str


class ScanResponse(BaseModel):
    score: int
    label: str
    reasons: List[str]
    explanation: str


class SimulatedEmail(BaseModel):
    scholarship: str
    admission: str
    professor: str
    it_alert: str
