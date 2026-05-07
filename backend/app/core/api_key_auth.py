import hashlib
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.project_api_key import ProjectApiKey


def hash_api_key(raw_key: str):
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def verify_api_key(db: Session, raw_key: str):
    if not raw_key:
        return None

    key_hash = hash_api_key(raw_key)

    api_key = db.query(ProjectApiKey).filter(
        ProjectApiKey.key_hash == key_hash,
        ProjectApiKey.revoked_at.is_(None)
    ).first()

    if not api_key:
        return None

    api_key.last_used_at = datetime.utcnow()
    db.commit()

    return api_key
