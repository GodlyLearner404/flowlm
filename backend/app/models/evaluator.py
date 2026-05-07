from datetime import datetime
import uuid

from sqlalchemy import Column, ForeignKey, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship

from app.core.database import Base


class Evaluator(Base):
    __tablename__ = "evaluators"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    judge_model = Column(String, nullable=False)
    evaluation_prompt = Column(Text, nullable=False)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    evaluations = relationship("Evaluation", backref="evaluator")
