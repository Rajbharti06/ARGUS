"""
UniShield AI — Scan History Repository
"""

from typing import List
from app.schemas import ScanResponse
from .base import BaseRepository


class InMemoryHistoryRepository(BaseRepository[ScanResponse]):
    def __init__(self):
        self._history: List[ScanResponse] = []

    def get(self, id: int) -> ScanResponse:
        return self._history[id]

    def create(self, data: ScanResponse) -> ScanResponse:
        self._history.append(data)
        return data

    def get_all(self) -> List[ScanResponse]:
        return self._history
