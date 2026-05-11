"""
UniShield AI — History Endpoints
"""

from typing import List
from fastapi import APIRouter, Depends
from app.schemas import ScanResponse
from app.services.history_service import HistoryService
from app.core.dependencies import get_history_service

router = APIRouter()


@router.get("/", response_model=List[ScanResponse])
def get_history(service: HistoryService = Depends(get_history_service)):
    """Get the scan history."""
    return service.get_history()
