from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from app.core.database import Base
import uuid
from datetime import datetime


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    prompt_version_id = Column(String, ForeignKey("prompt_versions.id"), nullable=False)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)

    status = Column(String, default="pending")  # pending, running, completed

    created_at = Column(TIMESTAMP, default=datetime.utcnow)