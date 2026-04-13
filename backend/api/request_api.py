from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import DataError

from database import get_db
from schema import (
    FeatureRequest, Client, FeatureRequestCreate,
    RequestStatus, User, UserType, Employee, EmployeeType,
    Task, TaskStatus, TaskPriority
)
from utils.jwt_handler import decode_token

router = APIRouter(prefix="/requests", tags=["Feature Requests"])


# -------------------------
# HELPER — best designer by active task count
# FIX: wrapped the .count() in a try/except so that if
# DESIGN_IN_PROGRESS doesn't exist in the DB enum yet
# (migration not run), it falls back to counting only TODO tasks
# instead of crashing the whole request with a 500.
# -------------------------

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
        try:
            # Primary query — uses both statuses (works after migration)
            count = db.query(Task).filter(
                Task.assigned_to == emp.id,
                Task.status.in_([TaskStatus.TODO, TaskStatus.DESIGN_IN_PROGRESS])
            ).count()
        except DataError:
            # Fallback — DESIGN_IN_PROGRESS not in DB yet (migration pending)
            # Roll back the failed query so the session stays usable
            db.rollback()
            count = db.query(Task).filter(
                Task.assigned_to == emp.id,
                Task.status == TaskStatus.TODO
            ).count()

        if count < lowest:
            lowest = count
            best = emp

    return best


# -------------------------
# SUBMIT REQUEST (client)
# -------------------------

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

    return {
        "message": "Feature request submitted",
        "request_id": new_request.id
    }


# -------------------------
# GET ALL REQUESTS (with task info)
# -------------------------

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
        task = db.query(Task).filter(Task.request_id == r.id).first()
        result.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "status": r.status.value,
            "client_id": r.client_id,
            "task": {
                "id": task.id,
                "status": task.status.value,
                "assigned_to": task.assigned_to,
                "priority": task.priority.value,
            } if task else None
        })

    return result


# -------------------------
# APPROVE / REJECT
# On APPROVED: auto-create task + assign to best designer
# -------------------------

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

    # Validate status value
    try:
        new_status = RequestStatus(status)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    task_info = None

    # -----------------------------------------------
    # APPROVAL BRANCH
    # -----------------------------------------------
    if new_status == RequestStatus.APPROVED:

        # Check task doesn't already exist for this request
        existing_task = db.query(Task).filter(Task.request_id == request_id).first()

        if existing_task:
            # Already has a task — just update request status
            req.status = RequestStatus.IN_PROGRESS
            db.commit()
            return {
                "message": "Request already has a task",
                "new_status": req.status.value,
                "task": {
                    "task_id": existing_task.id,
                    "assigned_to_designer": existing_task.assigned_to,
                    "status": existing_task.status.value
                }
            }

        # Find best available designer
        designer = get_best_designer(db)

        # Create task and assign to designer immediately
        task = Task(
            request_id=request_id,
            title=req.title,
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.DESIGN_IN_PROGRESS,
            assigned_to=designer.id if designer else None,
            git_branch=f"feature/{req.title.lower().replace(' ', '-').replace(',', '').replace('.', '')}"
        )

        db.add(task)

        # Request moves to IN_PROGRESS (not APPROVED — it's now being worked on)
        req.status = RequestStatus.IN_PROGRESS

        db.commit()
        db.refresh(task)

        task_info = {
            "task_id": task.id,
            "assigned_to_designer": designer.id if designer else None,
            "status": task.status.value
        }

        return {
            "message": f"Request approved. Task #{task.id} created and assigned to Designer.",
            "new_status": req.status.value,
            "task": task_info
        }

    # -----------------------------------------------
    # REJECTION BRANCH
    # -----------------------------------------------
    if new_status == RequestStatus.REJECTED:
        req.status = RequestStatus.REJECTED
        db.commit()
        return {
            "message": "Request rejected.",
            "new_status": req.status.value,
            "task": None
        }

    # -----------------------------------------------
    # ANY OTHER STATUS UPDATE
    # -----------------------------------------------
    req.status = new_status
    db.commit()
    return {
        "message": "Status updated",
        "new_status": req.status.value,
        "task": None
    }