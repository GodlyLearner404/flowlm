from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.services.prompt_service import PromptService
from app.schemas.prompt_version_schema import PromptVersionCreate
from app.services.prompt_version_service import PromptVersionService
from app.core.database import get_db
from app.services.execution_service import ExecutionService
from app.models.prompt import Prompt
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


@router.get("/prompts")
def list_prompts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    prompts = (
        db.query(Prompt)
        .options(joinedload(Prompt.versions))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": prompt.id,
            "name": prompt.name,
            "description": prompt.description,
            "versions": [
                {
                    "id": version.id,
                    "version": version.version_number,
                    "template": version.template,
                    "variables": version.variables or [],
                    "model": version.model,
                    "config": version.config or {}
                }
                for version in prompt.versions
            ]
        }
        for prompt in prompts
    ]

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


@router.get("/prompt-versions")
def list_prompt_versions(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    versions = db.query(PromptVersion).offset(offset).limit(limit).all()

    return [
        {
            "id": version.id,
            "prompt_id": version.prompt_id,
            "version": version.version_number,
            "template": version.template,
            "variables": version.variables or [],
            "model": version.model,
            "config": version.config or {}
        }
        for version in versions
    ]

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
