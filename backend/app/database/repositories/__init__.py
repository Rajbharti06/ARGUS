"""ARGUS — Domain-specific repositories"""

from app.database.repository import BaseRepository
from app.database.models import (
    TelemetryEvent, Entity, Relationship, Incident,
    PhishingAnalysis, CloudFinding, UserSession, ThreatIntel, ResponseAction,
)


class TelemetryRepository(BaseRepository[TelemetryEvent]):
    def __init__(self, session):
        super().__init__(TelemetryEvent, session)

    async def get_by_severity(self, severity: str, limit: int = 50):
        return await self.get_many(filters={"severity": severity}, limit=limit)

    async def get_by_module(self, module: str, limit: int = 50):
        return await self.get_many(filters={"module_source": module}, limit=limit)


class IncidentRepository(BaseRepository[Incident]):
    def __init__(self, session):
        super().__init__(Incident, session)

    async def get_active(self, limit: int = 20):
        return await self.get_many(
            filters={"status": "DETECTED"},
            limit=limit,
            order_by="detected_at",
        )

    async def get_by_severity(self, severity: str, limit: int = 20):
        return await self.get_many(filters={"severity": severity}, limit=limit)


class EntityRepository(BaseRepository[Entity]):
    def __init__(self, session):
        super().__init__(Entity, session)

    async def find_by_type(self, entity_type: str, limit: int = 50):
        return await self.get_many(filters={"entity_type": entity_type}, limit=limit)

    async def find_suspicious(self, min_risk: int = 50, limit: int = 50):
        # Would need custom query for range filter
        return await self.get_many(limit=limit)


class PhishingRepository(BaseRepository[PhishingAnalysis]):
    def __init__(self, session):
        super().__init__(PhishingAnalysis, session)

    async def get_critical(self, limit: int = 20):
        return await self.get_many(
            filters={"threat_level": "CRITICAL"},
            limit=limit,
            order_by="created_at",
        )
