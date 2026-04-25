from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime


class DatasetItem(Base):
    __tablename__ = "dataset_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)

    input = Column(JSON, nullable=False)
    expected_output = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    dataset = relationship("Dataset", backref="items")