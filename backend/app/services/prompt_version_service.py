from sqlalchemy.orm import Session
from app.models.prompt_version import PromptVersion
import uuid
from datetime import datetime


class PromptVersionService:

    @staticmethod
    def create_version(
        db: Session,
        prompt_id: str,
        template: str,
        variables: list,
        model: str,
        config: dict
    ):
        # find latest version number
        latest = (
            db.query(PromptVersion)
            .filter(PromptVersion.prompt_id == prompt_id)
            .order_by(PromptVersion.version_number.desc())
            .first()
        )

        next_version = 1 if not latest else latest.version_number + 1

        version = PromptVersion(
            id=str(uuid.uuid4()),
            prompt_id=prompt_id,
            version_number=next_version,
            template=template,
            variables=variables,
            model=model,
            config=config,
            created_at=datetime.utcnow()
        )

        db.add(version)
        db.commit()
        db.refresh(version)

        return version