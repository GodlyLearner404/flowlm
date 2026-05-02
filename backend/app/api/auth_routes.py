from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_token

router = APIRouter()


@router.post("/auth/register")
def register(email: str, password: str, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == email).first()

    if existing:
        raise HTTPException(400, "User already exists")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(password)
    )

    db.add(user)
    db.commit()

    return {"message": "User created"}


@router.post("/auth/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_token(user.id)

    return {"access_token": token}