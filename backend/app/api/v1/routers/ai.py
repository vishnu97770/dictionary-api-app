from fastapi import APIRouter
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/example/{word}")
async def generate_example(word: str):
    result = await AIService.generate_example(word)
    return result