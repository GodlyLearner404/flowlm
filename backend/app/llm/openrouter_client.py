import os
import time
from openai import OpenAI
from app.core.config import settings


client = OpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)


class OpenRouterClient:

    @staticmethod
    def generate(prompt: str, model: str, config: dict | None = None, messages: list[dict] | None = None):
        safe_config = dict(config or {})

        max_tokens = safe_config.get("max_tokens", 550)

        # Hard limit based on available credits
        if "free" in model.lower():
            max_tokens = min(max_tokens, 400)
        else:
            max_tokens = min(max_tokens, 800)

        safe_config["max_tokens"] = max_tokens

        request_messages = messages if messages is not None else [
            {"role": "user", "content": prompt}
        ]

        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=request_messages,
            **safe_config
        )
        latency_ms = int((time.time() - start_time) * 1000)

        choice = response.choices[0]
        message = getattr(choice, "message", None)
        output = getattr(message, "content", None) or ""
        finish_reason = getattr(choice, "finish_reason", None)

        usage = response.usage if hasattr(response, "usage") else None

        tokens = getattr(usage, "total_tokens", None) if usage else None

        return output, tokens, finish_reason, latency_ms
