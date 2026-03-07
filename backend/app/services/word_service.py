import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.word import Word


class WordService:

    @staticmethod
    async def search_word(db: AsyncSession, word: str):

        # 1️⃣ Check database cache
        result = await db.execute(select(Word).where(Word.word == word))
        existing_word = result.scalars().first()

        if existing_word:
            return {
                "word": existing_word.word,
                "phonetic": existing_word.phonetic,
                "definition": existing_word.definition
            }

        # 2️⃣ Call external dictionary API
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)

        if response.status_code != 200:
            return None

        data = response.json()[0]

        phonetic = data.get("phonetic", "")
        definition = data["meanings"][0]["definitions"][0]["definition"]

        # 3️⃣ Save to database
        new_word = Word(
            word=word,
            phonetic=phonetic,
            definition=definition
        )

        db.add(new_word)
        await db.commit()
        await db.refresh(new_word)

        return {
            "word": word,
            "phonetic": phonetic,
            "definition": definition
        }