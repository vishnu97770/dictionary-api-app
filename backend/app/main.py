from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.db import engine, Base

from app.models.user import User
from app.models.word import Word

from app.api.v1.routers import auth
from app.api.v1.routers import words 

from app.api.v1.routers import ai
import os

app = FastAPI(
    title="LexiSearch Dictionary API",
    description="Full Stack Dictionary Application Backend",
    version="1.0.0"
)


@app.on_event("startup")
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Allow frontend connection
frontend_url = os.getenv("FRONTEND_URL", "")
vercel_url = os.getenv("VERCEL_URL", "")

origins = [
    "http://localhost:5173",  # React frontend (local dev)
]

# Add specific production frontend URLs from env vars
if frontend_url:
    origins.append(f"https://{frontend_url}")
    origins.append(f"http://{frontend_url}")

if vercel_url:
    origins.append(f"https://{vercel_url}")

# Always allow the known Vercel deployment
origins.append("https://dictionary-api-app-lake.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(words.router) 
app.include_router(ai.router)


@app.get("/")
def root():
    return {
        "message": "LexiSearch API is running 🚀",
        "secret_key_loaded": bool(settings.SECRET_KEY)
    }
