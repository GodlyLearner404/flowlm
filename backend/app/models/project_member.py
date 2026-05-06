from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from app.core.database import Base
import uuid
from datetime import datetime


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
