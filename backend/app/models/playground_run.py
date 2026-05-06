from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from app.core.database import Base
import uuid
from datetime import datetime


class PlaygroundRun(Base):
    __tablename__ = "playground_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
