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
    # ── PostgreSQL for production ──────────────────────────────────────────────
    # Strip any ?ssl= query param — asyncpg reads SSL via connect_args only
    DATABASE_URL = _raw_url.split("?")[0]

    # Normalise URL scheme for asyncpg
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    # ── Detect Render Internal vs External URL ────────────────────────────────
    # Internal URL hostname ends with "-a" (e.g. dpg-xxx-a)  → no SSL needed
    # External URL has a region in the hostname               → SSL required
    #   e.g. dpg-xxx-a.virginia-postgres.render.com  (external, has region)
    #        dpg-xxx-a                                (internal, no dots)
    _hostname = DATABASE_URL.split("@")[-1].split("/")[0].split(":")[0]
    _is_internal = "." not in _hostname   # internal hostnames have no dots

    if _is_internal:
        # Render internal network — no SSL needed, fastest connection
        engine = create_async_engine(DATABASE_URL, echo=False)
    else:
        # External connection (local dev pointing to Render, or Supabase etc.)
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