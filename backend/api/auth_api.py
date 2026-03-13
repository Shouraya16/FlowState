from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schema import User, UserType

from utils.security import hash_password, verify_password
from utils.jwt_handler import create_token

router = APIRouter(prefix="/auth")


@router.post("/signup")
def signup(email: str, password: str, user_type: UserType, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(password)

    user = User(
        email=email,
        password_hash=hashed_pw,
        user_type=user_type
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User created"}

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)

    return {
        "access_token": token,
        "user_type": user.user_type
    }