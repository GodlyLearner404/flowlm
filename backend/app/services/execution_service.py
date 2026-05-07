from app.llm.openrouter_client import OpenRouterClient
from app.llm.prompt_builder import PromptBuilder


class ExecutionService:

    @staticmethod
    def run_prompt(prompt: str, model: str, config: dict | None = None):
        output, tokens, finish_reason, latency_ms = OpenRouterClient.generate(
            prompt,
            model,
            config or {}
        )

        return output, tokens, finish_reason, latency_ms

    @staticmethod
    def build_final_prompt(prompt_version, input_data):
        for var in prompt_version.variables:
            if var not in input_data:
                raise ValueError(f"Missing variable: {var}")

        final_prompt = PromptBuilder.build(
            prompt_version.template,
            prompt_version.variables,
            input_data
        )

        return final_prompt + "\n\nWrite a proper and complete response and use reasonable amount of tokens needed."

    @staticmethod
    def run(prompt_version, input_data, override_model: str | None = None):
        final_prompt = ExecutionService.build_final_prompt(prompt_version, input_data)

        model = override_model if override_model else prompt_version.model

        output, tokens, finish_reason, latency_ms = ExecutionService.run_prompt(
            final_prompt,
            model,
            prompt_version.config or {}
        )

        return final_prompt, output, tokens, finish_reason, latency_ms
