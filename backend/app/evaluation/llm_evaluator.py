from app.llm.openrouter_client import OpenRouterClient


class LLMEvaluator:

    @staticmethod
    def score(output: str, expected: str):
        if not expected:
            return None

        prompt = f"""
You are an evaluator.

Expected answer:
{expected}

Model output:
{output}

Give a score between 0 and 1 based on correctness.
Only return a number.
"""

        try:
            result, _tokens = OpenRouterClient.generate(
                prompt,
                model="openai/gpt-4o-mini",
                config={"max_tokens": 10, "temperature": 0}
            )

            return float(result.strip())

        except Exception:
            return None
