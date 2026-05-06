from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services.project_service import ProjectService

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str


class ProjectMemberCreate(BaseModel):
    user_id: str
    role: str


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
    project = ProjectService.get_project(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not ProjectService.is_project_member(db, project_id, user_id):
        raise HTTPException(status_code=403, detail="Project access denied")

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


@router.post("/projects/{project_id}/members")
def add_member(
    project_id: str,
    req: ProjectMemberCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    member = ProjectService.add_member(db, project_id, user_id, req.user_id, req.role)

    if not member:
        raise HTTPException(status_code=403, detail="Project access denied")

    return {
        "user_id": member.user_id,
        "role": member.role,
        "created_at": member.created_at
    }


@router.delete("/projects/{project_id}/members/{member_user_id}")
def remove_member(
    project_id: str,
    member_user_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    if not ProjectService.remove_member(db, project_id, user_id, member_user_id):
        raise HTTPException(status_code=403, detail="Project access denied")

    return {"status": "removed"}


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    if not ProjectService.delete_project(db, project_id, user_id):
        raise HTTPException(status_code=403, detail="Project access denied")

    return {"status": "deleted"}
