from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import traceback

from database import get_db
from schema import (
    FeatureRequest, Client, FeatureRequestCreate,
    RequestStatus, User, UserType, Employee, EmployeeType,
    Task, TaskStatus, TaskPriority
)
from utils.jwt_handler import decode_token
from utils.audit import log_action

router = APIRouter(prefix="/requests", tags=["Feature Requests"])


# -------------------------------------------------------
# HELPER — best designer by raw task count (no enum cast)
# -------------------------------------------------------

def get_best_designer(db: Session):
    designers = (
        db.query(Employee)
        .filter(Employee.employee_type == EmployeeType.DESIGNER)
        .all()
    )
    if not designers:
        return None

    best = None
    lowest = float("inf")

    for emp in designers:
        result = db.execute(
            text("SELECT COUNT(*) FROM tasks WHERE assigned_to = :eid"),
            {"eid": emp.id}
        )
        count = result.scalar() or 0
        if count < lowest:
            lowest = count
            best = emp

    return best


# -------------------------------------------------------
# POST /requests
# -------------------------------------------------------

@router.post("")
def submit_request(
    request: FeatureRequestCreate,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]

    client = db.query(Client).filter(Client.user_id == user_id).first()
    if not client:
        raise HTTPException(status_code=403, detail="Only clients can submit requests")

    new_request = FeatureRequest(
        client_id=client.id,
        title=request.title,
        description=request.description
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    log_action(db, user_id, "REQUEST_SUBMITTED", {
        "request_id": new_request.id,
        "title": new_request.title
    })

    return {"message": "Feature request submitted", "request_id": new_request.id}


# -------------------------------------------------------
# GET /requests
# -------------------------------------------------------

@router.get("")
def get_requests(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]
    user = db.query(User).filter(User.id == user_id).first()

    if user.user_type == UserType.CLIENT:
        client = db.query(Client).filter(Client.user_id == user_id).first()
        if not client:
            return []
        requests = db.query(FeatureRequest).filter(
            FeatureRequest.client_id == client.id
        ).all()
    else:
        requests = db.query(FeatureRequest).all()

    result = []
    for r in requests:
        row = db.execute(
            text("SELECT id, status, assigned_to, priority FROM tasks WHERE request_id = :rid LIMIT 1"),
            {"rid": r.id}
        ).fetchone()

        task_data = None
        if row:
            task_data = {
                "id": row[0],
                "status": row[1],
                "assigned_to": row[2],
                "priority": row[3],
            }

        result.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "status": r.status.value,
            "client_id": r.client_id,
            "task": task_data,
        })

    return result


# -------------------------------------------------------
# PATCH /requests/{id}/status
# -------------------------------------------------------

@router.patch("/{request_id}/status")
def update_status(
    request_id: int,
    status: str,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]
    user = db.query(User).filter(User.id == user_id).first()

    if user.user_type == UserType.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot update request status")

    req = db.query(FeatureRequest).filter(FeatureRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    status_upper = status.strip().upper()

    # ── APPROVE ──────────────────────────────────────────
    if status_upper == "APPROVED":
        try:
            existing = db.execute(
                text("SELECT id, assigned_to FROM tasks WHERE request_id = :rid LIMIT 1"),
                {"rid": request_id}
            ).fetchone()

            if existing:
                req.status = RequestStatus.IN_PROGRESS
                db.commit()
                return {
                    "message": "Request already has a task",
                    "new_status": req.status.value,
                    "task": {
                        "task_id": existing[0],
                        "assigned_to_designer": existing[1],
                        "status": "DESIGN_IN_PROGRESS",
                    }
                }

            designer = get_best_designer(db)
            designer_id = designer.id if designer else None

            safe_title = (
                req.title.lower()
                .replace(" ", "-")
                .replace(",", "")
                .replace(".", "")
                .replace("/", "")
            )

            # Raw SQL insert — avoids SQLAlchemy enum cast errors
            db.execute(text("""
                INSERT INTO tasks (request_id, title, priority, status, assigned_to, git_branch)
                VALUES (:rid, :title, 'MEDIUM', 'DESIGN_IN_PROGRESS', :assigned_to, :branch)
            """), {
                "rid": request_id,
                "title": req.title,
                "assigned_to": designer_id,
                "branch": f"feature/{safe_title}"
            })

            task_row = db.execute(
                text("SELECT id FROM tasks WHERE request_id = :rid ORDER BY id DESC LIMIT 1"),
                {"rid": request_id}
            ).fetchone()
            task_id = task_row[0] if task_row else None

            req.status = RequestStatus.IN_PROGRESS
            db.commit()

            log_action(db, user_id, "REQUEST_APPROVED", {
                "request_id": request_id,
                "title": req.title,
                "task_id": task_id,
                "assigned_to_designer": designer_id
            })

            if designer:
                log_action(db, designer_id, "TASK_ASSIGNED", {
                    "task_id": task_id,
                    "title": req.title,
                    "assigned_by": user_id,
                    "phase": "DESIGN"
                })

            return {
                "message": f"Approved. Task #{task_id} created and assigned to designer.",
                "new_status": req.status.value,
                "task": {
                    "task_id": task_id,
                    "assigned_to_designer": designer_id,
                    "status": "DESIGN_IN_PROGRESS",
                    "warning": "No designer found — signup a Designer user first" if not designer_id else None,
                }
            }

        except Exception as e:
            db.rollback()
            print("APPROVAL ERROR:\n", traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Approval failed: {str(e)}")

    # ── REJECT ───────────────────────────────────────────
    if status_upper == "REJECTED":
        req.status = RequestStatus.REJECTED
        db.commit()

        log_action(db, user_id, "REQUEST_REJECTED", {
            "request_id": request_id,
            "title": req.title
        })

        return {"message": "Request rejected", "new_status": "REJECTED", "task": None}

    # ── OTHER ────────────────────────────────────────────
    try:
        req.status = RequestStatus(status_upper)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    db.commit()
    return {"message": "Status updated", "new_status": req.status.value, "task": None}