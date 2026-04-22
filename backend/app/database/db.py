import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

DATABASE_URL = os.getenv("DATABASE_URL","postgresql+asyncpg://dictionary_api_app_db_user:rPHiiYduY3N3iKDEroNj923WlmTGNMLm@dpg-d7kdninavr4c73c7spo0-a.virginia-postgres.render.com/dictionary_api_app_db")

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session