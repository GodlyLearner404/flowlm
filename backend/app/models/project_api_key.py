from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from app.core.database import Base
import uuid
from datetime import datetime


class ProjectApiKey(Base):
    __tablename__ = "project_api_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    key_hash = Column(String, nullable=False)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    last_used_at = Column(TIMESTAMP, nullable=True)
    revoked_at = Column(TIMESTAMP, nullable=True)
