from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, Float, Integer, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
from sqlalchemy import Float, Integer


class Run(Base):
    __tablename__ = "runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    dataset_item_id = Column(String, ForeignKey("dataset_items.id"), nullable=False)
    prompt_version_id = Column(String, ForeignKey("prompt_versions.id"), nullable=True)

    input = Column(JSON, nullable=False)
    output = Column(Text, nullable=True)

    score = Column(Float, nullable=True)

    latency_ms = Column(Integer, nullable=True)

    extra_data = Column(JSON, nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
  
    tokens_used = Column(Integer, nullable=True)
    cost = Column(Float, nullable=True)

    experiment = relationship("Experiment", backref="runs")
