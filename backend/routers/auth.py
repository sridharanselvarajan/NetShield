"""
NetShield AI — Authentication & RBAC Routers
Exposes endpoints for user registration, login, and token generation.
Implements dependency injection for route-based role checks.
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from models.database import get_db, User
from models import schemas

# ─── Security Configuration ───────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-netshield-secure-key-1234567890-soc-dashboard")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3600  # Long lifetime for easy local developer testing

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])


# ─── Cryptography Helpers ──────────────────────────────────────────
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ─── Auth Endpoints ────────────────────────────────────────────────
@router.post("/register", response_model=schemas.UserOut)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered. Please choose another username."
        )

    # Hash the password
    hashed_pwd = get_password_hash(user_data.password)

    # Validate and normalize role (default to analyst)
    role = user_data.role.lower() if user_data.role else "analyst"
    if role not in ["admin", "analyst"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role selected. Allowed roles are: 'admin', 'analyst'"
        )

    new_user = User(
        username=user_data.username,
        hashed_password=hashed_pwd,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login_user(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }


# ─── Authentication Dependencies (RBAC) ───────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission Denied: Resolve permissions are restricted to {', '.join(self.allowed_roles).upper()}s."
            )
        return current_user
