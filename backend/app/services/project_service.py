from sqlalchemy.orm import Session
import secrets
from datetime import datetime

from app.models.project import Project
from app.models.project_api_key import ProjectApiKey
from app.models.project_member import ProjectMember
from app.core.api_key_auth import hash_api_key


class ProjectService:
    API_KEY_PRINCIPAL_PREFIX = "api_key:"
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
        principal = ProjectService.parse_api_key_principal(user_id)

        if principal:
            return principal if principal["project_id"] == project_id else None

        return db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        ).first()

    @staticmethod
    def build_api_key_principal(project_id: str, key_id: str):
        return f"{ProjectService.API_KEY_PRINCIPAL_PREFIX}{project_id}:{key_id}"

    @staticmethod
    def parse_api_key_principal(user_id: str):
        if not isinstance(user_id, str) or not user_id.startswith(ProjectService.API_KEY_PRINCIPAL_PREFIX):
            return None

        remainder = user_id[len(ProjectService.API_KEY_PRINCIPAL_PREFIX):]
        parts = remainder.split(":", 1)

        if len(parts) != 2:
            return None

        return {
            "project_id": parts[0],
            "key_id": parts[1],
            "role": ProjectService.ADMIN
        }

    @staticmethod
    def is_project_member(db: Session, project_id: str, user_id: str):
        return ProjectService.get_member(db, project_id, user_id) is not None

    @staticmethod
    def is_project_admin(db: Session, project_id: str, user_id: str):
        member = ProjectService.get_member(db, project_id, user_id)
        role = member["role"] if isinstance(member, dict) else member.role if member is not None else None
        return role in {ProjectService.OWNER, ProjectService.ADMIN}

    @staticmethod
    def is_project_owner(db: Session, project_id: str, user_id: str):
        member = ProjectService.get_member(db, project_id, user_id)
        role = member["role"] if isinstance(member, dict) else member.role if member is not None else None
        return role == ProjectService.OWNER

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
    def create_api_key(db: Session, project_id: str, user_id: str, name: str):
        if not ProjectService.is_project_admin(db, project_id, user_id):
            return None, None

        raw_key = f"flowlm_{secrets.token_urlsafe(24).rstrip('=')}"
        api_key = ProjectApiKey(
            project_id=project_id,
            name=name,
            key_hash=hash_api_key(raw_key),
            created_by_user_id=user_id,
            created_at=datetime.utcnow()
        )
        db.add(api_key)
        db.commit()
        db.refresh(api_key)

        return api_key, raw_key

    @staticmethod
    def list_api_keys(db: Session, project_id: str, user_id: str):
        if not ProjectService.is_project_admin(db, project_id, user_id):
            return None

        return db.query(ProjectApiKey).filter(ProjectApiKey.project_id == project_id).all()

    @staticmethod
    def revoke_api_key(db: Session, project_id: str, key_id: str, user_id: str):
        if not ProjectService.is_project_admin(db, project_id, user_id):
            return False

        api_key = db.query(ProjectApiKey).filter(
            ProjectApiKey.id == key_id,
            ProjectApiKey.project_id == project_id,
            ProjectApiKey.revoked_at.is_(None)
        ).first()

        if not api_key:
            return False

        api_key.revoked_at = datetime.utcnow()
        db.commit()

        return True

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

        db.query(ProjectApiKey).filter(ProjectApiKey.project_id == project_id).delete()
        db.query(ProjectMember).filter(ProjectMember.project_id == project_id).delete()
        db.delete(project)
        db.commit()

        return True
