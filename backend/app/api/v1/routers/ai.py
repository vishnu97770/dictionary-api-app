from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])


class ExampleResponse(BaseModel):
    word: str
    examples: List[str]


@router.get("/example/{word}", response_model=ExampleResponse)
async def generate_example(word: str):
    result = await AIService.generate_example(word)
    return result