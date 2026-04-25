from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    prompt_id = Column(String, ForeignKey("prompts.id"), nullable=False)

    version_number = Column(Integer, nullable=False)

    template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)

    model = Column(String, nullable=False)
    config = Column(JSON, nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # relationship (optional but useful later)
    prompt = relationship("Prompt", backref="versions")