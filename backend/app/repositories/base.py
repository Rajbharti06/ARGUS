"""
UniShield AI — Base Repository
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    @abstractmethod
    def get(self, id: Any) -> T:
        pass

    @abstractmethod
    def create(self, data: T) -> T:
        pass
