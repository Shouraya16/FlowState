from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from schema import User
from utils.security import hash_password, verify_password
from utils.jwt_handler import create_token

router = APIRouter(prefix="/auth")


# -------------------------
# Request models
# -------------------------

class SignupRequest(BaseModel):
    email: str
    password: str
    user_type: str


class LoginRequest(BaseModel):
    email: str
    password: str


# -------------------------
# Signup API
# -------------------------

@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == data.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pw = hash_password(data.password)

    new_user = User(
        email=data.email,
        password_hash=hashed_pw,
        user_type=data.user_type
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


# -------------------------
# Login API
# -------------------------

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)

    return {
        "access_token": token,
        "user_type": user.user_type
    }