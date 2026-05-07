from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.project_api_key import ProjectApiKey
from app.services.project_service import ProjectService

router = APIRouter()


class ProjectApiKeyCreate(BaseModel):
    name: str


@router.post("/projects/{project_id}/api-keys")
def create_project_api_key(
    project_id: str,
    req: ProjectApiKeyCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    api_key, raw_key = ProjectService.create_api_key(db, project_id, user_id, req.name)

    if not api_key:
        raise HTTPException(status_code=403, detail="Project access denied")

    return {
        "id": api_key.id,
        "name": api_key.name,
        "key": raw_key,
        "created_at": api_key.created_at
    }


@router.get("/projects/{project_id}/api-keys")
def list_project_api_keys(
    project_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    api_keys = ProjectService.list_api_keys(db, project_id, user_id)

    if api_keys is None:
        raise HTTPException(status_code=403, detail="Project access denied")

    return [
        {
            "id": api_key.id,
            "name": api_key.name,
            "created_by_user_id": api_key.created_by_user_id,
            "created_at": api_key.created_at,
            "last_used_at": api_key.last_used_at,
            "revoked_at": api_key.revoked_at
        }
        for api_key in api_keys
    ]


@router.delete("/projects/{project_id}/api-keys/{key_id}")
def revoke_project_api_key(
    project_id: str,
    key_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    if not ProjectService.is_project_admin(db, project_id, user_id):
        raise HTTPException(status_code=403, detail="Project access denied")

    api_key = db.query(ProjectApiKey).filter(
        ProjectApiKey.id == key_id,
        ProjectApiKey.project_id == project_id,
        ProjectApiKey.revoked_at.is_(None)
    ).first()

    if not api_key:
        raise HTTPException(status_code=403, detail="Project access denied")

    api_key.revoked_at = datetime.utcnow()
    db.commit()

    return {"status": "revoked"}
