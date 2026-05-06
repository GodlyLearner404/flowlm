from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember


class ProjectService:

    @staticmethod
    def create_project(db: Session, user_id: str, name: str):
        project = Project(name=name, owner_user_id=user_id)
        db.add(project)
        db.flush()

        member = ProjectMember(
            project_id=project.id,
            user_id=user_id,
            role="owner"
        )
        db.add(member)
        db.commit()
        db.refresh(project)

        return project

    @staticmethod
    def get_user_projects(db: Session, user_id: str):
        return (
            db.query(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .filter(ProjectMember.user_id == user_id)
            .all()
        )

    @staticmethod
    def get_project_by_id(db: Session, project_id: str, user_id: str):
        return (
            db.query(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .filter(
                Project.id == project_id,
                ProjectMember.user_id == user_id
            )
            .first()
        )

    @staticmethod
    def list_members(db: Session, project_id: str):
        return db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
