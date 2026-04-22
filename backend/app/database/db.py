import os
import ssl as ssl_lib
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# ─────────────────────────────────────────────
# Database URL Resolution
# ─────────────────────────────────────────────
# • LOCAL DEV  : No DATABASE_URL set  →  uses SQLite (dictionary.db, zero setup)
# • PRODUCTION : DATABASE_URL is set  →  uses PostgreSQL with SSL
# ─────────────────────────────────────────────

_raw_url = os.getenv("DATABASE_URL", "")

if not _raw_url:
    # ── SQLite for local development ──────────────────────────────────────────
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_FILE  = os.path.join(BASE_DIR, "dictionary.db")
    DATABASE_URL = f"sqlite+aiosqlite:///{DB_FILE}"
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    # ── PostgreSQL for production (Render / Supabase / any cloud PG) ──────────
    # Strip any ?ssl= query param — asyncpg reads SSL via connect_args only
    DATABASE_URL = _raw_url.split("?")[0]

    # Replace postgres:// with postgresql+asyncpg:// if needed
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Build SSL context — works with Render, Supabase, Neon, etc.
    ssl_context = ssl_lib.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl_lib.CERT_NONE

    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"ssl": ssl_context},
    )

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session