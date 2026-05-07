from datetime import datetime
import uuid

from sqlalchemy import Column, Float, ForeignKey, String, Text, TIMESTAMP

from app.core.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluator_id = Column(String, ForeignKey("evaluators.id"), nullable=False)
    playground_run_id = Column(String, ForeignKey("playground_runs.id"), nullable=True)
    experiment_run_id = Column(String, ForeignKey("runs.id"), nullable=True)
    input_text = Column(Text, nullable=True)
    output_text = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    raw_judge_response = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
