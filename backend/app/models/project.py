from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from app.core.database import Base
import uuid
from datetime import datetime


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    owner_user_id = Column(String, ForeignKey("users.id"), nullable=False)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
