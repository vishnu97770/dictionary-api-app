from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Optional — if not set, the app uses SQLite locally
    DATABASE_URL: Optional[str] = None

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GEMINI_API_KEY: str

    class Config:
        env_file = ".env"


settings = Settings()