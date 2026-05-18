"""ARGUS — Generic async repository with CRUD + query patterns"""

from typing import Generic, TypeVar, Type, Optional, List, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, delete, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def create(self, **kwargs) -> ModelType:
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def get(self, id: str) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_many(
        self,
        limit: int = 100,
        offset: int = 0,
        order_by: Optional[str] = None,
        descending: bool = True,
        filters: Optional[dict] = None,
    ) -> List[ModelType]:
        stmt = select(self.model)
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    stmt = stmt.where(getattr(self.model, key) == value)
        if order_by and hasattr(self.model, order_by):
            col = getattr(self.model, order_by)
            stmt = stmt.order_by(col.desc() if descending else col.asc())
        stmt = stmt.offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, id: str, **kwargs) -> Optional[ModelType]:
        instance = await self.get(id)
        if not instance:
            return None
        for key, value in kwargs.items():
            if hasattr(instance, key) and value is not None:
                setattr(instance, key, value)
        setattr(instance, "updated_at", datetime.now(timezone.utc))
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def delete(self, id: str) -> bool:
        instance = await self.get(id)
        if not instance:
            return False
        await self.session.delete(instance)
        await self.session.commit()
        return True

    async def count(self, filters: Optional[dict] = None) -> int:
        stmt = select(func.count()).select_from(self.model)
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    stmt = stmt.where(getattr(self.model, key) == value)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def get_recent(self, limit: int = 50) -> List[ModelType]:
        if hasattr(self.model, "created_at"):
            col = self.model.created_at
        elif hasattr(self.model, "timestamp"):
            col = self.model.timestamp
        else:
            col = self.model.id
        stmt = select(self.model).order_by(col.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def search(self, column: str, value: str, limit: int = 50) -> List[ModelType]:
        if not hasattr(self.model, column):
            return []
        col = getattr(self.model, column)
        stmt = select(self.model).where(col.ilike(f"%{value}%")).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def bulk_create(self, items: List[dict]) -> List[ModelType]:
        instances = [self.model(**item) for item in items]
        self.session.add_all(instances)
        await self.session.commit()
        for inst in instances:
            await self.session.refresh(inst)
        return instances

    async def raw_query(self, sql: str, params: Optional[dict] = None) -> List[Any]:
        result = await self.session.execute(text(sql), params or {})
        return result.all()
