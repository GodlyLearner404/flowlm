from sqlalchemy import Column, String
from app.core.database import Base
import uuid

class Test(Base):
    __tablename__ = "test"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))