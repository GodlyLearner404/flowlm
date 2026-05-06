from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from app.core.database import Base
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    prompt_version_id = Column(String, ForeignKey("prompt_versions.id"), nullable=False)
    prompt_version_ids = Column(JSONB, nullable=True)
    best_prompt_version_id = Column(String, nullable=True)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)

    status = Column(String, default="pending")  # pending, running, completed

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
