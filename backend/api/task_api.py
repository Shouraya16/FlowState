from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from schema import (
    Task, TaskStatus, TaskPriority,
    Employee, Developer, FeatureRequest, RequestStatus, EmployeeType
)
from utils.jwt_handler import decode_token

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# -------------------------
# REQUEST MODELS
# -------------------------

class TaskCreate(BaseModel):
    title: str
    request_id: int
    priority: str = "MEDIUM"


class AssetUpload(BaseModel):
    asset_url: str


# -------------------------
# SMART ASSIGN HELPER
# -------------------------

def get_best_developer(db: Session):
    """Return the developer Employee with lowest active ticket count."""
    developers = (
        db.query(Employee)
        .filter(Employee.employee_type == EmployeeType.DEVELOPER)
        .all()
    )
    if not developers:
        return None

    best = None
    lowest = float("inf")

    for emp in developers:
        dev_profile = emp.developer_profile
        count = dev_profile.active_ticket_count if dev_profile else 0
        if count < lowest:
            lowest = count
            best = emp

    return best


# -------------------------
# CREATE TASK (from approved request)
# -------------------------

@router.post("")
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    # Validate request exists and is approved
    req = db.query(FeatureRequest).filter(FeatureRequest.id == data.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Feature request not found")
    if req.status != RequestStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Request must be APPROVED before creating tasks")

    # Smart assign
    assignee = get_best_developer(db)

    try:
        priority_enum = TaskPriority(data.priority.upper())
    except Exception:
        priority_enum = TaskPriority.MEDIUM

    task = Task(
        request_id=data.request_id,
        title=data.title,
        priority=priority_enum,
        status=TaskStatus.TODO,
        assigned_to=assignee.id if assignee else None,
        git_branch=f"feature/{data.title.lower().replace(' ', '-')}"
    )

    db.add(task)

    # Increment active ticket count
    if assignee and assignee.developer_profile:
        assignee.developer_profile.active_ticket_count += 1

    # Move request to IN_PROGRESS
    req.status = RequestStatus.IN_PROGRESS

    db.commit()
    db.refresh(task)

    return {
        "message": "Task created and assigned",
        "task_id": task.id,
        "assigned_to": assignee.id if assignee else None,
        "git_branch": task.git_branch
    }


# -------------------------
# GET ALL TASKS
# -------------------------

@router.get("")
def get_all_tasks(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    tasks = db.query(Task).all()
    return [_format_task(t) for t in tasks]


# -------------------------
# GET MY TASKS (developer / designer)
# -------------------------

@router.get("/my-tasks")
def get_my_tasks(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]

    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(status_code=403, detail="Not an employee account")

    tasks = db.query(Task).filter(Task.assigned_to == employee.id).all()
    return [_format_task(t) for t in tasks]


# -------------------------
# GET QA TASKS (tester)
# -------------------------

@router.get("/qa-tasks")
def get_qa_tasks(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    tasks = db.query(Task).filter(
        Task.status.in_([TaskStatus.READY_FOR_QA, TaskStatus.PASSED, TaskStatus.FAILED])
    ).all()
    return [_format_task(t) for t in tasks]


# -------------------------
# UPDATE TASK STATUS (developer)
# -------------------------

@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    status: str,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Map status string to enum — support extended statuses
    status_map = {
        "TODO": TaskStatus.TODO,
        "IN_PROGRESS": TaskStatus.IN_PROGRESS,
        "DONE": TaskStatus.DONE,
        "READY_FOR_QA": TaskStatus.READY_FOR_QA,
        "READY_TO_DEPLOY": TaskStatus.READY_TO_DEPLOY,
    }

    new_status = status_map.get(status.upper())
    if not new_status:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    # When developer marks DONE, auto-move to READY_FOR_QA
    if new_status == TaskStatus.DONE:
        task.status = TaskStatus.READY_FOR_QA
    else:
        task.status = new_status

    # Decrement ticket count when task is finished
    if new_status in [TaskStatus.DONE, TaskStatus.READY_FOR_QA]:
        if task.assignee and task.assignee.developer_profile:
            count = task.assignee.developer_profile.active_ticket_count
            task.assignee.developer_profile.active_ticket_count = max(0, count - 1)

    db.commit()
    return {"message": "Task status updated", "new_status": task.status.value}


# -------------------------
# QA RESULT (tester: pass or fail)
# -------------------------

@router.patch("/{task_id}/qa-result")
def qa_result(
    task_id: int,
    result: str,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if result.lower() == "pass":
        task.status = TaskStatus.READY_TO_DEPLOY
        message = "Task passed QA and is ready to deploy"
    elif result.lower() == "fail":
        task.status = TaskStatus.IN_PROGRESS  # Revert to dev
        message = "Task failed QA and reverted to In Progress"
    else:
        raise HTTPException(status_code=400, detail="Result must be 'pass' or 'fail'")

    db.commit()
    return {"message": message, "status": task.status.value}


# -------------------------
# UPLOAD ASSET (designer)
# -------------------------

@router.post("/{task_id}/assets")
def upload_asset(
    task_id: int,
    data: AssetUpload,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Store asset URL in git_branch field temporarily
    # In production, create a separate Asset model
    task.git_branch = data.asset_url
    db.commit()

    return {"message": "Asset URL saved", "asset_url": data.asset_url}


# -------------------------
# FORMAT HELPER
# -------------------------

def _format_task(t: Task):
    return {
        "id": t.id,
        "title": t.title,
        "status": t.status.value if t.status else "TODO",
        "priority": t.priority.value if t.priority else "MEDIUM",
        "git_branch": t.git_branch,
        "request_id": t.request_id,
        "assigned_to": t.assigned_to,
    }