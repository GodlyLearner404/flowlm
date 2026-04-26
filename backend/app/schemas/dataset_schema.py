from pydantic import BaseModel
from typing import Optional, Dict, Any


class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DatasetItemCreate(BaseModel):
    input: Dict[str, Any]
    expected_output: Optional[str] = None