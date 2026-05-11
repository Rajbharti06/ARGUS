"""
UniShield AI — Application Dependencies
"""

from app.services.history_service import HistoryService
from app.repositories.history_repository import InMemoryHistoryRepository


history_service = HistoryService(InMemoryHistoryRepository())


def get_history_service() -> HistoryService:
    return history_service
