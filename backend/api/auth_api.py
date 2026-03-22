from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from schema import User, Client, Employee, UserType, EmployeeType
from utils.security import hash_password, verify_password
from utils.jwt_handler import create_token

router = APIRouter(prefix="/auth")


# -------------------------
# REQUEST MODELS
# -------------------------

class SignupRequest(BaseModel):
    email: str
    password: str
    user_type: str
    employee_type: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


# -------------------------
# SIGNUP
# -------------------------

@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):

    # 🔍 CHECK EXISTING USER
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pw = hash_password(data.password)

    # 🔥 FIX: HANDLE CASE + ENUM
    try:
        user_type_enum = UserType(data.user_type.upper())
    except:
        raise HTTPException(status_code=400, detail="Invalid user type")

    # ✅ CREATE USER
    new_user = User(
        email=data.email,
        password_hash=hashed_pw,
        user_type=user_type_enum
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # -------------------------
    # CREATE ROLE PROFILE
    # -------------------------

    if user_type_enum == UserType.CLIENT:

        client = Client(
            user_id=new_user.id,
            company_name="Default Company"
        )

        db.add(client)
        db.commit()
        db.refresh(client)

    elif user_type_enum == UserType.EMPLOYEE:

        if not data.employee_type:
            raise HTTPException(status_code=400, detail="Employee role required")

        try:
            emp_type_enum = EmployeeType(data.employee_type.upper())
        except:
            raise HTTPException(status_code=400, detail="Invalid employee type")

        employee = Employee(
            user_id=new_user.id,
            emp_id=f"EMP{new_user.id}",
            employee_type=emp_type_enum
        )

        db.add(employee)
        db.commit()
        db.refresh(employee)

    return {"message": "User created successfully"}


# -------------------------
# LOGIN
# -------------------------

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)

    role = user.user_type.value

    # 🔥 if employee → return actual role
    if role == "EMPLOYEE" and user.employee_profile:
        role = user.employee_profile.employee_type.value

    return {
        "token": token,
        "role": role
    }