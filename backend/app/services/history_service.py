"""
UniShield AI — Scan History Service
"""

from typing import List
from app.schemas import ScanResponse
from app.repositories.history_repository import InMemoryHistoryRepository


class HistoryService:
    def __init__(self, repository: InMemoryHistoryRepository):
        self._repository = repository

    def get_history(self) -> List[ScanResponse]:
        return self._repository.get_all()

    def add_to_history(self, data: ScanResponse) -> ScanResponse:
        return self._repository.create(data)
