import hashlib

from sqlalchemy.orm import Session

from app.models.project_api_key import ProjectApiKey


def hash_api_key(raw_key: str):
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def verify_api_key(db: Session, raw_key: str):
    key_hash = hash_api_key(raw_key)

    return db.query(ProjectApiKey).filter(
        ProjectApiKey.key_hash == key_hash,
        ProjectApiKey.revoked_at.is_(None)
    ).first()
