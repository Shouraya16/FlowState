from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from schema import Task, TaskStatus, Employee, EmployeeType, AuditLog
from utils.jwt_handler import decode_token

router = APIRouter(prefix="/qa", tags=["QA"])


# -------------------------
# REQUEST MODEL
# -------------------------

class QAResultRequest(BaseModel):
    result: str          # "pass" or "fail"
    notes: str = ""      # optional tester notes


# -------------------------
# HELPER
# -------------------------

def log_action(db: Session, user_id: int, action: str, details: dict):
    log = AuditLog(user_id=user_id, action_type=action, details=details)
    db.add(log)


def verify_tester(db: Session, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee or employee.employee_type != EmployeeType.TESTER:
        raise HTTPException(status_code=403, detail="Only testers can submit QA results")
    return employee


# -------------------------
# GET QA TASKS (tasks in READY_FOR_QA)
# -------------------------

@router.get("/tasks")
def get_qa_tasks(
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    verify_tester(db, token_data["user_id"])

    tasks = db.query(Task).filter(
        Task.status == TaskStatus.READY_FOR_QA
    ).all()

    # Also include PASSED and FAILED so tester can see history
    all_qa_tasks = db.query(Task).filter(
        Task.status.in_([
            TaskStatus.READY_FOR_QA,
            TaskStatus.DONE  # DONE here means passed QA
        ])
    ).all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "priority": t.priority.value,
            "status": t.status.value,
            "request_id": t.request_id,
            "assigned_to": t.assigned_to,
            "developer_email": t.assignee.user.email if t.assignee and t.assignee.user else None
        }
        for t in all_qa_tasks
    ]


# -------------------------
# SUBMIT QA RESULT
# -------------------------

@router.patch("/tasks/{task_id}/result")
def submit_qa_result(
    task_id: int,
    data: QAResultRequest,
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    user_id = token_data["user_id"]
    tester = verify_tester(db, user_id)

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status != TaskStatus.READY_FOR_QA:
        raise HTTPException(
            status_code=400,
            detail=f"Task must be in READY_FOR_QA status. Current status: {task.status.value}"
        )

    result = data.result.lower()

    if result not in ("pass", "fail"):
        raise HTTPException(status_code=400, detail="Result must be 'pass' or 'fail'")

    if result == "pass":
        task.status = TaskStatus.DONE  # DONE = passed QA, ready to deploy
        action = "QA_PASS"
        message = "Task passed QA and is ready for deployment"
    else:
        task.status = TaskStatus.IN_PROGRESS  # Revert to dev
        action = "QA_FAIL"
        message = "Task failed QA and has been sent back to the developer"

    db.commit()
    db.refresh(task)

    log_action(db, user_id, action, {
        "task_id": task_id,
        "tester_id": tester.id,
        "notes": data.notes,
        "new_status": task.status.value
    })
    db.commit()

    return {
        "message": message,
        "task_id": task_id,
        "result": result,
        "new_status": task.status.value
    }