from app.llm.openrouter_client import OpenRouterClient
from app.llm.prompt_builder import PromptBuilder


class ExecutionService:

    @staticmethod
    def run(prompt_version, input_data):
        # build final prompt
        final_prompt = PromptBuilder.build(
            prompt_version.template,
            prompt_version.variables,
            input_data
        )

        # call LLM
        output = OpenRouterClient.generate(
            final_prompt,
            prompt_version.model,
            prompt_version.config or {}
        )

        return final_prompt, output