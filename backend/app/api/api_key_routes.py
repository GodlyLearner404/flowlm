from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
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
    if not ProjectService.revoke_api_key(db, project_id, key_id, user_id):
        raise HTTPException(status_code=403, detail="Project access denied")

    return {"status": "revoked"}
