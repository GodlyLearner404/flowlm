from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion

router = APIRouter()


class DeployRequest(BaseModel):
    prompt_id: str
    version_id: str


def _get_prompt_version(db: Session, prompt_id: str, version_id: str, user_id: str):
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == user_id
    ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    version = db.query(PromptVersion).filter(
        PromptVersion.id == version_id,
        PromptVersion.prompt_id == prompt_id
    ).first()

    if not version:
        raise HTTPException(status_code=400, detail="Version does not belong to prompt")

    return prompt, version


@router.post("/deploy/production")
def deploy_production(
    req: DeployRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    prompt, _ = _get_prompt_version(db, req.prompt_id, req.version_id, user_id)
    prompt.production_version_id = req.version_id
    db.commit()

    return {"production_version_id": prompt.production_version_id}


@router.post("/deploy/staging")
def deploy_staging(
    req: DeployRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    prompt, _ = _get_prompt_version(db, req.prompt_id, req.version_id, user_id)
    prompt.staging_version_id = req.version_id
    db.commit()

    return {"staging_version_id": prompt.staging_version_id}


@router.get("/deploy/{prompt_id}")
def get_deployment(
    prompt_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == user_id
    ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return {
        "production_version_id": prompt.production_version_id,
        "staging_version_id": prompt.staging_version_id
    }
