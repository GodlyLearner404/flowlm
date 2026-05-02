from pydantic import BaseModel
from pydantic import field_validator
from typing import List, Dict, Any


class PromptVersionCreate(BaseModel):
    template: str
    variables: List[str]
    model: str
    config: Dict[str, Any]

    @field_validator("model")
    @classmethod
    def validate_model(cls, value: str):
        model = value.strip()

        if not model or model == "gpt-test" or "/" not in model:
            raise ValueError(
                "Use a real OpenRouter model id, for example openai/gpt-4o-mini"
            )

        return model
