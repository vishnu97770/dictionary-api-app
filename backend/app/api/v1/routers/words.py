from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.db import get_db
from app.services.word_service import WordService

router = APIRouter(prefix="/words", tags=["Words"])


@router.get("/search/{word}")
async def search_word(word: str, db: AsyncSession = Depends(get_db)):
    
    result = await WordService.search_word(db, word)

    if not result:
        raise HTTPException(status_code=404, detail="Word not found")

    return result