from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services.prompt_service import PromptService
from app.schemas.prompt_version_schema import PromptVersionCreate
from app.services.prompt_version_service import PromptVersionService
from app.core.database import get_db

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