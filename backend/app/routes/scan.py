"""
UniShield AI — Scan Endpoints
"""

from fastapi import APIRouter, Depends
from app.core.engine import run_analysis
from app.schemas import ScanRequest, ScanResponse
from app.services.history_service import HistoryService
from app.core.dependencies import get_history_service

router = APIRouter()


@router.post("/email", response_model=ScanResponse)
def scan_email(
    req: ScanRequest, history_service: HistoryService = Depends(get_history_service)
):
    """Scan an email for phishing and get an AI-powered explanation."""
    result = run_analysis(req.email, req.provider, req.api_key)
    history_service.add_to_history(result)
    return result
