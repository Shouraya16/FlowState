from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schema import User, Employee, Client, Admin, AuditLog, UserType
from utils.jwt_handler import decode_token

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(token_data, db: Session):
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user or user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# -------------------------
# GET ALL USERS
# -------------------------

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    require_admin(token_data, db)

    users = db.query(User).all()
    result = []

    for u in users:
        role = u.user_type.value

        if u.employee_profile:
            role = u.employee_profile.employee_type.value

        result.append({
            "id": u.id,
            "email": u.email,
            "role": role,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })

    return result


# -------------------------
# DELETE USER
# -------------------------

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    require_admin(token_data, db)

    if token_data["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User removed"}


# -------------------------
# GET AUDIT LOGS
# -------------------------

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    require_admin(token_data, db)

    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user.email if log.user else None,
            "action_type": log.action_type,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        }
        for log in logs
    ]