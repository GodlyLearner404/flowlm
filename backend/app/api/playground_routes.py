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
    models: list[str] | None = None

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
    
    results = []
    final_prompt = ExecutionService.build_final_prompt(version, req.input_data)

    models = req.models if req.models else [version.model]

    for model in models:
        try:
            final_prompt, output, tokens, finish_reason, latency_ms = ExecutionService.run(
                version,
                req.input_data,
                override_model=model
            )

            results.append({
                "model": model,
                "status": "completed",
                "output": output,
                "tokens": tokens,
                "finish_reason": finish_reason,
                "latency_ms": latency_ms
            })
        except Exception as error:
            results.append({
                "model": model,
                "status": "failed",
                "output": str(error)
            })

    return {
        "prompt": final_prompt,
        "results": results
    }
