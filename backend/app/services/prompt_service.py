from sqlalchemy.orm import Session
from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.models.project_member import ProjectMember
import uuid
from datetime import datetime


class PromptService:

    @staticmethod
    def user_is_project_member(db: Session, project_id: str, user_id: str):
        return db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        ).first() is not None

    @staticmethod
    def create_prompt(db: Session, name: str, description: str = None, user_id: str = None, project_id: str = None):
        if not PromptService.user_is_project_member(db, project_id, user_id):
            return None

        prompt = Prompt(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            user_id=user_id,
            project_id=project_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(prompt)
        db.commit()
        db.refresh(prompt)

        return prompt

    @staticmethod
    def get_user_prompts(db: Session, user_id: str):
        return (
            db.query(Prompt)
            .join(ProjectMember, ProjectMember.project_id == Prompt.project_id)
            .filter(ProjectMember.user_id == user_id)
        )

    @staticmethod
    def get_prompt_for_user(db: Session, prompt_id: str, user_id: str):
        return (
            db.query(Prompt)
            .join(ProjectMember, ProjectMember.project_id == Prompt.project_id)
            .filter(
                Prompt.id == prompt_id,
                ProjectMember.user_id == user_id
            )
            .first()
        )

    @staticmethod
    def get_user_prompt_versions(db: Session, user_id: str):
        return (
            db.query(PromptVersion)
            .join(Prompt, Prompt.id == PromptVersion.prompt_id)
            .join(ProjectMember, ProjectMember.project_id == Prompt.project_id)
            .filter(ProjectMember.user_id == user_id)
        )

    @staticmethod
    def get_prompt_version_for_user(db: Session, version_id: str, user_id: str):
        return (
            db.query(PromptVersion)
            .join(Prompt, Prompt.id == PromptVersion.prompt_id)
            .join(ProjectMember, ProjectMember.project_id == Prompt.project_id)
            .filter(
                PromptVersion.id == version_id,
                ProjectMember.user_id == user_id
            )
            .first()
        )
