from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)

    owned_projects = relationship("Project", backref="owner", foreign_keys="Project.owner_user_id")
    project_memberships = relationship("ProjectMember", backref="user", foreign_keys="ProjectMember.user_id")
