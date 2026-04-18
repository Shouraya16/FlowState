from sqlalchemy.orm import Session
from schema import AuditLog


def log_action(db: Session, user_id: int, action_type: str, details: dict = None):
    """
    Write a single audit log entry.
    Call this after any meaningful action in any API.
    
    action_type examples:
        USER_SIGNUP, USER_LOGIN,
        REQUEST_SUBMITTED, REQUEST_APPROVED, REQUEST_REJECTED,
        TASK_CREATED, TASK_ASSIGNED, TASK_STARTED,
        DESIGN_COMPLETE, TASK_SUBMITTED_FOR_QA,
        QA_PASSED, QA_FAILED,
        USER_DELETED
    """
    try:
        entry = AuditLog(
            user_id=user_id,
            action_type=action_type,
            details=details or {}
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        # Never crash the main request because of a logging failure
        db.rollback()
        print(f"[AUDIT LOG ERROR] {e}")