from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.db import engine, Base

from app.models.user import User
from app.models.word import Word

from app.api.v1.routers import auth
from app.api.v1.routers import words 

from app.api.v1.routers import ai

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
origins = [
    "http://localhost:5173",  # React frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
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
