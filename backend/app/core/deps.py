from fastapi import Depends, HTTPException, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime
from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.core.api_key_auth import verify_api_key
from app.services.project_service import ProjectService

security = HTTPBearer(auto_error=False)


def _supports_api_key_auth(path: str):
    return path.startswith("/deploy/") or path.startswith("/production/run/")

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    try:
        if credentials:
            token = credentials.credentials
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload["sub"]  # user_id

        if x_api_key and _supports_api_key_auth(request.url.path):
            api_key = verify_api_key(db, x_api_key)

            if not api_key:
                raise HTTPException(401, "Invalid token")

            api_key.last_used_at = datetime.utcnow()
            db.commit()

            return ProjectService.build_api_key_principal(api_key.project_id, api_key.id)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Invalid token")

    raise HTTPException(401, "Invalid token")
