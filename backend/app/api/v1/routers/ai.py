from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List

from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])


class ExampleResponse(BaseModel):
    word: str
    examples: List[str]


class TranslateResponse(BaseModel):
    word: str
    language: str
    translated: str


@router.get("/example/{word}", response_model=ExampleResponse)
async def generate_example(word: str):
    result = await AIService.generate_example(word)
    return result


@router.get("/translate/{word}", response_model=TranslateResponse)
async def translate_meaning(
    word: str,
    meaning: str = Query(..., description="The English meaning to translate"),
    language: str = Query(..., description="Target language name (e.g. Hindi, Spanish)"),
):
    result = await AIService.translate_meaning(word, meaning, language)
    return result