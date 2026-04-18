from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schema import User, Employee, AuditLog, UserType
from utils.jwt_handler import decode_token
from utils.audit import log_action

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(token_data, db: Session):
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user or user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# -------------------------------------------------------
# GET /admin/users
# -------------------------------------------------------

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


# -------------------------------------------------------
# DELETE /admin/users/{id}
# -------------------------------------------------------

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    admin_user = require_admin(token_data, db)

    if token_data["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = user.email
    db.delete(user)
    db.commit()

    log_action(db, token_data["user_id"], "USER_DELETED", {
        "deleted_user_id": user_id,
        "deleted_email": email,
        "deleted_by": admin_user.email
    })

    return {"message": "User removed"}


# -------------------------------------------------------
# GET /admin/audit-logs
# Returns last 200 logs with user email, action, details, time
# -------------------------------------------------------

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    require_admin(token_data, db)

    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(200)
        .all()
    )

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user.email if log.user else "System",
            "action_type": log.action_type,
            "details": log.details or {},
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        }
        for log in logs
    ]