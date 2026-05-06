from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.prompt_version import PromptVersion
import uuid
from datetime import datetime

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    production_version_id = Column(String, ForeignKey("prompt_versions.id"), nullable=True)
    staging_version_id = Column(String, ForeignKey("prompt_versions.id"), nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


PromptVersion.prompt = relationship(
    "Prompt",
    backref="versions",
    foreign_keys=[PromptVersion.prompt_id]
)
