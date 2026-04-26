from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.prompt_service import PromptService
from app.schemas.prompt_version_schema import PromptVersionCreate
from app.services.prompt_version_service import PromptVersionService
from app.core.database import get_db
from app.services.execution_service import ExecutionService
from app.models.prompt_version import PromptVersion

router = APIRouter()


@router.post("/prompt")
def create_prompt(name: str, description: str = None, db: Session = Depends(get_db)):
    prompt = PromptService.create_prompt(db, name, description)

    return {
        "id": prompt.id,
        "name": prompt.name,
        "description": prompt.description
    }

@router.post("/prompt/{prompt_id}/version")
def create_prompt_version(
    prompt_id: str,
    req: PromptVersionCreate,
    db: Session = Depends(get_db)
):
    version = PromptVersionService.create_version(
        db,
        prompt_id,
        req.template,
        req.variables,
        req.model,
        req.config
    )

    return {
        "id": version.id,
        "prompt_id": version.prompt_id,
        "version": version.version_number
    }

@router.post("/test-run/{version_id}")
def test_run(version_id: str, input_data: dict, db: Session = Depends(get_db)):
    version = db.query(PromptVersion).filter(PromptVersion.id == version_id).first()

    if not version:
        raise HTTPException(status_code=404, detail="Prompt version not found")

    final_prompt, output = ExecutionService.run(version, input_data)

    return {
        "prompt": final_prompt,
        "output": output
    }