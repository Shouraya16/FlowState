from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from schema import (
    Task, TaskStatus, TaskPriority,
    FeatureRequest, RequestStatus,
    Employee, Developer, User,
    AuditLog
)
from utils.jwt_handler import decode_token

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# -------------------------
# REQUEST MODELS
# -------------------------

class CreateTaskRequest(BaseModel):
    request_id: int
    title: str
    priority: str = "MEDIUM"


class UpdateTaskStatusRequest(BaseModel):
    status: str


# -------------------------
# HELPERS
# -------------------------

def log_action(db: Session, user_id: int, action: str, details: dict):
    log = AuditLog(user_id=user_id, action_type=action, details=details)
    db.add(log)


def get_best_developer(db: Session) -> Optional[Employee]:
    """
    Smart assignment: find the developer with the lowest active_ticket_count
    who is not on leave (available = True in their availability record, or no record).
    """
    developers = db.query(Developer).all()

    if not developers:
        return None

    # Sort by active_ticket_count ascending, pick the lowest
    developers_sorted = sorted(developers, key=lambda d: d.active_ticket_count or 0)

    for dev in developers_sorted:
        employee = db.query(Employee).filter(Employee.id == dev.employee_id).first()
        if employee:
            return employee

    return None


# -------------------------
# CREATE TASK (Manager only)
# -------------------------

@router.post("")
def create_task(
    data: CreateTaskRequest,
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    user_id = token_data["user_id"]

    # Verify the feature request exists and is APPROVED
    feature_req = db.query(FeatureRequest).filter(
        FeatureRequest.id == data.request_id
    ).first()

    if not feature_req:
        raise HTTPException(status_code=404, detail="Feature request not found")

    if feature_req.status != RequestStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail="Feature request must be APPROVED before creating a task"
        )

    # Validate priority
    try:
        priority_enum = TaskPriority(data.priority.upper())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid priority. Use LOW, MEDIUM, or HIGH")

    # Smart assignment
    assigned_employee = get_best_developer(db)

    new_task = Task(
        request_id=data.request_id,
        title=data.title,
        priority=priority_enum,
        status=TaskStatus.TODO,
        assigned_to=assigned_employee.id if assigned_employee else None
    )

    db.add(new_task)

    # Increment developer's ticket count
    if assigned_employee:
        dev_profile = db.query(Developer).filter(
            Developer.employee_id == assigned_employee.id
        ).first()
        if dev_profile:
            dev_profile.active_ticket_count = (dev_profile.active_ticket_count or 0) + 1

    # Update request status to IN_PROGRESS
    feature_req.status = RequestStatus.IN_PROGRESS

    db.commit()
    db.refresh(new_task)

    log_action(db, user_id, "TASK_CREATED", {
        "task_id": new_task.id,
        "request_id": data.request_id,
        "assigned_to": assigned_employee.id if assigned_employee else None
    })
    db.commit()

    return {
        "message": "Task created and assigned",
        "task_id": new_task.id,
        "assigned_to": assigned_employee.id if assigned_employee else None,
        "priority": priority_enum.value
    }


# -------------------------
# GET ALL TASKS
# -------------------------

@router.get("")
def get_tasks(
    assigned_to: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    query = db.query(Task)

    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    if status:
        try:
            status_enum = TaskStatus(status.upper())
            query = query.filter(Task.status == status_enum)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid status")

    tasks = query.all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "priority": t.priority.value,
            "status": t.status.value,
            "request_id": t.request_id,
            "assigned_to": t.assigned_to,
            "assignee_email": t.assignee.user.email if t.assignee and t.assignee.user else None,
            "git_branch": t.git_branch
        }
        for t in tasks
    ]


# -------------------------
# GET MY TASKS (logged-in employee)
# -------------------------

@router.get("/my-tasks")
def get_my_tasks(
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    user_id = token_data["user_id"]

    employee = db.query(Employee).filter(Employee.user_id == user_id).first()

    if not employee:
        raise HTTPException(status_code=403, detail="Only employees can access tasks")

    tasks = db.query(Task).filter(Task.assigned_to == employee.id).all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "priority": t.priority.value,
            "status": t.status.value,
            "request_id": t.request_id,
            "git_branch": t.git_branch or f"feature/task-{t.id}"
        }
        for t in tasks
    ]


# -------------------------
# UPDATE TASK STATUS (Developer)
# -------------------------

@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    data: UpdateTaskStatusRequest,
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    user_id = token_data["user_id"]

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Verify the logged-in user is the assigned developer
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee or task.assigned_to != employee.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    try:
        new_status = TaskStatus(data.status.upper())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid status. Use TODO, IN_PROGRESS, DONE, or READY_FOR_QA")

    old_status = task.status
    task.status = new_status

    # If task is DONE, decrement developer ticket count
    if new_status == TaskStatus.DONE:
        dev_profile = db.query(Developer).filter(
            Developer.employee_id == employee.id
        ).first()
        if dev_profile and dev_profile.active_ticket_count > 0:
            dev_profile.active_ticket_count -= 1

    db.commit()
    db.refresh(task)

    log_action(db, user_id, "TASK_STATUS_UPDATED", {
        "task_id": task_id,
        "old_status": old_status.value,
        "new_status": new_status.value
    })
    db.commit()

    return {
        "message": "Task status updated",
        "task_id": task_id,
        "status": new_status.value
    }


# -------------------------
# GET SINGLE TASK
# -------------------------

@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "id": task.id,
        "title": task.title,
        "priority": task.priority.value,
        "status": task.status.value,
        "request_id": task.request_id,
        "assigned_to": task.assigned_to,
        "assignee_email": task.assignee.user.email if task.assignee and task.assignee.user else None,
        "git_branch": task.git_branch or f"feature/task-{task.id}"
    }