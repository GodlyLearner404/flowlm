from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services.execution_service import ExecutionService
from app.models.prompt_version import PromptVersion

router = APIRouter()

from pydantic import BaseModel

class PlaygroundRequest(BaseModel):
    version_id: str
    input_data: dict

@router.post("/playground/run")
def run_playground(
    req: PlaygroundRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    # 🔥 fetch prompt version
    version = db.query(PromptVersion).filter(
        PromptVersion.id == req.version_id
    ).first()

    if not version:
        return {"error": "Invalid version"}

    # 🔥 run instantly (no celery)
    final_prompt, output, tokens = ExecutionService.run(
        version,
        req.input_data
    )

    return {
        "prompt": final_prompt,
        "output": output,
        "tokens": tokens
    }