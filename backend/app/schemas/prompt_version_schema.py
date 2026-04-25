from pydantic import BaseModel
from typing import List, Dict, Any


class PromptVersionCreate(BaseModel):
    template: str
    variables: List[str]
    model: str
    config: Dict[str, Any]