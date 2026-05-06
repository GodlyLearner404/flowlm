from fastapi import APIRouter, Depends
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
    project = ProjectService.create_project(db, req.name, user_id)
    return _serialize_project(project)


@router.get("/projects")
def list_projects(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    projects = ProjectService.list_projects(db, user_id)
    return [_serialize_project(project) for project in projects]


@router.get("/projects/{project_id}")
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    project = ProjectService.get_project(db, project_id, user_id)
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
