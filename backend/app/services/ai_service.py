import httpx


class AIService:

    @staticmethod
    async def generate_example(word: str):

        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)

        data = response.json()

        try:
            example = data[0]["meanings"][0]["definitions"][0].get("example")

            if not example:
                example = f"This is an example sentence using the word '{word}'."

        except Exception:
            example = f"This is an example sentence using the word '{word}'."

        return {
            "word": word,
            "example": example
        }
