from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services.project_service import ProjectService

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str


def _serialize_project(project):
    return {
        "id": project.id,
        "name": project.name,
        "owner_user_id": project.owner_user_id,
        "created_at": project.created_at
    }


@router.post("/projects")
def create_project(
    req: ProjectCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    project = ProjectService.create_project(db, user_id, req.name)
    return _serialize_project(project)


@router.get("/projects")
def list_projects(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    projects = ProjectService.get_user_projects(db, user_id)
    return [_serialize_project(project) for project in projects]


@router.get("/projects/{project_id}")
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    project = ProjectService.get_project_by_id(db, project_id, user_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    members = ProjectService.list_members(db, project.id)

    data = _serialize_project(project)
    data["members"] = [
        {
            "user_id": member.user_id,
            "role": member.role,
            "created_at": member.created_at
        }
        for member in members
    ]

    return data
