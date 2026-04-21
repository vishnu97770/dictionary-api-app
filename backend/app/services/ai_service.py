import os
import json

from google import genai
from dotenv import load_dotenv

load_dotenv()

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class AIService:

    @staticmethod
    async def generate_example(word: str):
        prompt = (
            f'Generate 2 natural, real-life example sentences for the English word "{word}".\n\n'
            "Rules:\n"
            "- Each sentence must be 15 words or fewer.\n"
            "- Must sound human and conversational — like something a person would actually say.\n"
            "- Do NOT include any definitions, explanations, or descriptions of the word.\n"
            "- Only show the word being used naturally in context.\n"
            "- The two sentences must be clearly different from each other.\n\n"
            "Return ONLY a valid JSON object in this exact format, with no extra text:\n"
            '{"examples": ["sentence1", "sentence2"]}'
        )

        try:
            response = await _client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            raw = response.text.strip()

            # Strip markdown code fences if the model wraps the JSON
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            data = json.loads(raw)
            examples = data.get("examples", [])

            if len(examples) < 2:
                raise ValueError("Not enough examples returned")

            return {"word": word, "examples": examples[:2]}

        except Exception:
            # Graceful fallback — still returns the correct shape
            return {
                "word": word,
                "examples": [
                    f"She used '{word}' perfectly in her speech today.",
                    f"He finally understood what '{word}' really meant.",
                ],
            }
