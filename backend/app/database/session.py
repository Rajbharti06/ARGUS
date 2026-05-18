"""ARGUS — Async database session management"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://argus:argus_pass@localhost:5432/argus",
)

# Fallback to SQLite for development if Postgres is unavailable
if "postgresql" in DATABASE_URL and not os.getenv("USE_POSTGRES"):
    DATABASE_URL = "sqlite+aiosqlite:///data/argus.db"

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        from app.database.models import ALL_MODELS
        await conn.run_sync(Base.metadata.create_all)
