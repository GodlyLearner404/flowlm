from fastapi import Depends, HTTPException
from jose import jwt
from app.core.security import SECRET_KEY, ALGORITHM

def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except:
        raise HTTPException(401, "Invalid token")