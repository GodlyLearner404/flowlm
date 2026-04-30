import os
from openai import OpenAI
from app.core.config import settings


client = OpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)


class OpenRouterClient:

    @staticmethod
    def generate(prompt: str, model: str, config: dict):
        safe_config = {
            "max_tokens": 150,
            **(config or {})
        }

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            **safe_config   # ✅ THIS IS THE FIX
        )

        output = response.choices[0].message.content

        usage = response.usage if hasattr(response, "usage") else None

        tokens = usage.total_tokens if usage else None

        return output, tokens