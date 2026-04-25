from sqlalchemy.orm import Session
from app.models.prompt import Prompt
import uuid
from datetime import datetime


class PromptService:

    @staticmethod
    def create_prompt(db: Session, name: str, description: str = None):
        prompt = Prompt(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(prompt)
        db.commit()
        db.refresh(prompt)

        return prompt