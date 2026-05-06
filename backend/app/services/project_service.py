from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember


class ProjectService:
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    ROLES = {OWNER, ADMIN, MEMBER}

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
    def get_member(db: Session, project_id: str, user_id: str):
        return db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        ).first()

    @staticmethod
    def is_project_member(db: Session, project_id: str, user_id: str):
        return ProjectService.get_member(db, project_id, user_id) is not None

    @staticmethod
    def is_project_admin(db: Session, project_id: str, user_id: str):
        member = ProjectService.get_member(db, project_id, user_id)
        return member is not None and member.role in {ProjectService.OWNER, ProjectService.ADMIN}

    @staticmethod
    def is_project_owner(db: Session, project_id: str, user_id: str):
        member = ProjectService.get_member(db, project_id, user_id)
        return member is not None and member.role == ProjectService.OWNER

    @staticmethod
    def get_user_projects(db: Session, user_id: str):
        return (
            db.query(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .filter(ProjectMember.user_id == user_id)
            .all()
        )

    @staticmethod
    def get_project(db: Session, project_id: str):
        return db.query(Project).filter(Project.id == project_id).first()

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

    @staticmethod
    def add_member(db: Session, project_id: str, user_id: str, member_user_id: str, role: str):
        if role not in ProjectService.ROLES or not ProjectService.is_project_admin(db, project_id, user_id):
            return None

        if role == ProjectService.OWNER and not ProjectService.is_project_owner(db, project_id, user_id):
            return None

        member = ProjectService.get_member(db, project_id, member_user_id)

        if member and member.role == ProjectService.OWNER and not ProjectService.is_project_owner(db, project_id, user_id):
            return None

        if member:
            member.role = role
        else:
            member = ProjectMember(project_id=project_id, user_id=member_user_id, role=role)
            db.add(member)

        db.commit()
        db.refresh(member)

        return member

    @staticmethod
    def remove_member(db: Session, project_id: str, user_id: str, member_user_id: str):
        if not ProjectService.is_project_admin(db, project_id, user_id):
            return False

        member = ProjectService.get_member(db, project_id, member_user_id)

        if not member or member.role == ProjectService.OWNER:
            return False

        db.delete(member)
        db.commit()

        return True

    @staticmethod
    def delete_project(db: Session, project_id: str, user_id: str):
        if not ProjectService.is_project_owner(db, project_id, user_id):
            return False

        project = db.query(Project).filter(Project.id == project_id).first()

        if not project:
            return False

        db.query(ProjectMember).filter(ProjectMember.project_id == project_id).delete()
        db.delete(project)
        db.commit()

        return True
