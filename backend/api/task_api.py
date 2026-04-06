from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from schema import (
    Task, TaskStatus, TaskPriority,
    Employee, EmployeeType,
    FeatureRequest, RequestStatus
)
from utils.jwt_handler import decode_token

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class AssetUpload(BaseModel):
    asset_url: str


# -------------------------
# HELPERS
# -------------------------

def get_best_employee_of_type(db: Session, emp_type: EmployeeType):
    """Return the Employee of given type with the lowest active task count."""
    employees = (
        db.query(Employee)
        .filter(Employee.employee_type == emp_type)
        .all()
    )
    if not employees:
        return None

    best = None
    lowest = float("inf")

    active_statuses = [
        TaskStatus.TODO,
        TaskStatus.DESIGN_IN_PROGRESS,
        TaskStatus.IN_PROGRESS,
    ]

    for emp in employees:
        count = db.query(Task).filter(
            Task.assigned_to == emp.id,
            Task.status.in_(active_statuses)
        ).count()
        if count < lowest:
            lowest = count
            best = emp

    return best


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
# GET MY TASKS (designer / developer)
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
        Task.status.in_([
            TaskStatus.READY_FOR_QA,
            TaskStatus.PASSED,
            TaskStatus.FAILED
        ])
    ).all()
    return [_format_task(t) for t in tasks]


# -------------------------
# UPDATE TASK STATUS
# handles designer → developer handoff automatically
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

    user_id = token_data["user_id"]
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()

    status_upper = status.upper()

    # -------------------------------------------------------
    # DESIGNER marks DESIGN_COMPLETE
    # → reassign to best Developer, status becomes IN_PROGRESS
    # -------------------------------------------------------
    if status_upper == "DESIGN_COMPLETE":

        if employee and employee.employee_type != EmployeeType.DESIGNER:
            raise HTTPException(status_code=403, detail="Only designers can mark design complete")

        developer = get_best_employee_of_type(db, EmployeeType.DEVELOPER)

        task.status = TaskStatus.IN_PROGRESS
        task.assigned_to = developer.id if developer else task.assigned_to

        # increment developer ticket count
        if developer and developer.developer_profile:
            developer.developer_profile.active_ticket_count += 1

        db.commit()
        return {
            "message": "Design complete. Task reassigned to developer.",
            "new_status": task.status.value,
            "assigned_to_developer": developer.id if developer else None
        }

    # -------------------------------------------------------
    # DEVELOPER marks DONE
    # → auto-advance to READY_FOR_QA, decrement ticket count
    # -------------------------------------------------------
    if status_upper == "DONE":

        task.status = TaskStatus.READY_FOR_QA

        if task.assignee and task.assignee.developer_profile:
            count = task.assignee.developer_profile.active_ticket_count
            task.assignee.developer_profile.active_ticket_count = max(0, count - 1)

        db.commit()
        return {
            "message": "Task marked done. Moved to QA.",
            "new_status": task.status.value
        }

    # -------------------------------------------------------
    # GENERAL STATUS UPDATE (start task etc.)
    # -------------------------------------------------------
    status_map = {
        "TODO": TaskStatus.TODO,
        "DESIGN_IN_PROGRESS": TaskStatus.DESIGN_IN_PROGRESS,
        "IN_PROGRESS": TaskStatus.IN_PROGRESS,
        "READY_FOR_QA": TaskStatus.READY_FOR_QA,
        "READY_TO_DEPLOY": TaskStatus.READY_TO_DEPLOY,
    }

    new_status = status_map.get(status_upper)
    if not new_status:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    task.status = new_status
    db.commit()
    return {"message": "Status updated", "new_status": task.status.value}


# -------------------------
# QA RESULT (tester)
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
        # revert to developer
        task.status = TaskStatus.IN_PROGRESS
        message = "Task failed QA. Reverted to developer."
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