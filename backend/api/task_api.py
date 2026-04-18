from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from database import get_db
from schema import Employee, EmployeeType
from utils.jwt_handler import decode_token
from utils.audit import log_action

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class AssetUpload(BaseModel):
    asset_url: str


class GitLinkUpdate(BaseModel):
    git_link: str


# -------------------------------------------------------
# HELPER — best employee of type by raw task count
# -------------------------------------------------------

def get_best_employee_of_type(db: Session, emp_type):
    employees = (
        db.query(Employee)
        .filter(Employee.employee_type == emp_type)
        .all()
    )
    if not employees:
        return None

    best = None
    lowest = float("inf")

    for emp in employees:
        result = db.execute(
            text("SELECT COUNT(*) FROM tasks WHERE assigned_to = :eid"),
            {"eid": emp.id}
        )
        count = result.scalar() or 0
        if count < lowest:
            lowest = count
            best = emp

    return best


def _row_to_dict(r):
    return {
        "id": r[0],
        "title": r[1],
        "status": r[2],
        "priority": r[3],
        "git_branch": r[4],
        "request_id": r[5],
        "assigned_to": r[6],
    }


# -------------------------------------------------------
# GET /tasks — all tasks
# -------------------------------------------------------

@router.get("")
def get_all_tasks(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    rows = db.execute(text(
        "SELECT id, title, status, priority, git_branch, request_id, assigned_to "
        "FROM tasks ORDER BY id DESC"
    )).fetchall()
    return [_row_to_dict(r) for r in rows]


# -------------------------------------------------------
# GET /tasks/my-tasks
# -------------------------------------------------------

@router.get("/my-tasks")
def get_my_tasks(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(status_code=403, detail="Not an employee account")

    rows = db.execute(
        text("SELECT id, title, status, priority, git_branch, request_id, assigned_to "
             "FROM tasks WHERE assigned_to = :eid ORDER BY id DESC"),
        {"eid": employee.id}
    ).fetchall()
    return [_row_to_dict(r) for r in rows]


# -------------------------------------------------------
# GET /tasks/qa-tasks
# -------------------------------------------------------

@router.get("/qa-tasks")
def get_qa_tasks(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    rows = db.execute(text(
        "SELECT id, title, status, priority, git_branch, request_id, assigned_to "
        "FROM tasks WHERE status IN ('READY_FOR_QA', 'PASSED', 'FAILED') ORDER BY id DESC"
    )).fetchall()
    return [_row_to_dict(r) for r in rows]


# -------------------------------------------------------
# PATCH /tasks/{id}/status
# -------------------------------------------------------

@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    status: str,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]

    row = db.execute(
        text("SELECT id, title, status, assigned_to FROM tasks WHERE id = :tid"),
        {"tid": task_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    status_upper = status.strip().upper()

    # ── DESIGN_COMPLETE → reassign to developer ──────────
    if status_upper == "DESIGN_COMPLETE":
        developer = get_best_employee_of_type(db, EmployeeType.DEVELOPER)
        dev_id = developer.id if developer else row[3]

        db.execute(text(
            "UPDATE tasks SET status = 'IN_PROGRESS', assigned_to = :dev_id WHERE id = :tid"
        ), {"dev_id": dev_id, "tid": task_id})
        db.commit()

        log_action(db, user_id, "DESIGN_COMPLETE", {
            "task_id": task_id,
            "title": row[1],
            "reassigned_to_developer": dev_id
        })

        if developer:
            log_action(db, dev_id, "TASK_ASSIGNED", {
                "task_id": task_id,
                "title": row[1],
                "phase": "DEVELOPMENT"
            })

        return {
            "message": "Design complete. Task reassigned to developer.",
            "new_status": "IN_PROGRESS",
            "assigned_to_developer": dev_id
        }

    # ── IN_PROGRESS (start) ──────────────────────────────
    if status_upper == "IN_PROGRESS":
        db.execute(
            text("UPDATE tasks SET status = 'IN_PROGRESS' WHERE id = :tid"),
            {"tid": task_id}
        )
        db.commit()

        log_action(db, user_id, "TASK_STARTED", {
            "task_id": task_id,
            "title": row[1]
        })

        return {"message": "Task started.", "new_status": "IN_PROGRESS"}

    # ── DONE → auto-advance to READY_FOR_QA ─────────────
    if status_upper == "DONE":
        db.execute(
            text("UPDATE tasks SET status = 'READY_FOR_QA' WHERE id = :tid"),
            {"tid": task_id}
        )
        db.commit()

        log_action(db, user_id, "TASK_SUBMITTED_FOR_QA", {
            "task_id": task_id,
            "title": row[1]
        })

        return {"message": "Task done. Moved to QA.", "new_status": "READY_FOR_QA"}

    # ── General fallback ─────────────────────────────────
    allowed = {"TODO", "DESIGN_IN_PROGRESS", "READY_FOR_QA", "READY_TO_DEPLOY"}
    if status_upper not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    db.execute(
        text("UPDATE tasks SET status = :s WHERE id = :tid"),
        {"s": status_upper, "tid": task_id}
    )
    db.commit()

    log_action(db, user_id, "TASK_STATUS_UPDATED", {
        "task_id": task_id,
        "title": row[1],
        "new_status": status_upper
    })

    return {"message": "Status updated", "new_status": status_upper}


# -------------------------------------------------------
# PATCH /tasks/{id}/git-link
# -------------------------------------------------------

@router.patch("/{task_id}/git-link")
def update_git_link(
    task_id: int,
    data: GitLinkUpdate,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]

    row = db.execute(
        text("SELECT id, title FROM tasks WHERE id = :tid"),
        {"tid": task_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    db.execute(
        text("UPDATE tasks SET git_branch = :url WHERE id = :tid"),
        {"url": data.git_link, "tid": task_id}
    )
    db.commit()

    log_action(db, user_id, "GIT_LINK_SAVED", {
        "task_id": task_id,
        "title": row[1],
        "git_link": data.git_link
    })

    return {"message": "GitHub link saved", "git_branch": data.git_link}


# -------------------------------------------------------
# PATCH /tasks/{id}/submit-for-qa
# -------------------------------------------------------

@router.patch("/{task_id}/submit-for-qa")
def submit_for_qa(
    task_id: int,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]

    row = db.execute(
        text("SELECT id, title, git_branch FROM tasks WHERE id = :tid"),
        {"tid": task_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    if not row[2]:
        raise HTTPException(
            status_code=400,
            detail="Please save a GitHub link before submitting for QA"
        )

    db.execute(
        text("UPDATE tasks SET status = 'READY_FOR_QA' WHERE id = :tid"),
        {"tid": task_id}
    )
    db.commit()

    log_action(db, user_id, "TASK_SUBMITTED_FOR_QA", {
        "task_id": task_id,
        "title": row[1],
        "git_link": row[2]
    })

    return {"message": "Task submitted for QA", "new_status": "READY_FOR_QA"}


# -------------------------------------------------------
# PATCH /tasks/{id}/qa-result
# -------------------------------------------------------

@router.patch("/{task_id}/qa-result")
def qa_result(
    task_id: int,
    result: str,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]

    row = db.execute(
        text("SELECT id, title FROM tasks WHERE id = :tid"),
        {"tid": task_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    if result.lower() == "pass":
        new_status = "READY_TO_DEPLOY"
        action = "QA_PASSED"
        message = "Task passed QA and is ready to deploy"
    elif result.lower() == "fail":
        new_status = "IN_PROGRESS"
        action = "QA_FAILED"
        message = "Task failed QA. Reverted to developer."
    else:
        raise HTTPException(status_code=400, detail="Result must be 'pass' or 'fail'")

    db.execute(
        text("UPDATE tasks SET status = :s WHERE id = :tid"),
        {"s": new_status, "tid": task_id}
    )
    db.commit()

    log_action(db, user_id, action, {
        "task_id": task_id,
        "title": row[1],
        "new_status": new_status
    })

    return {"message": message, "status": new_status}


# -------------------------------------------------------
# POST /tasks/{id}/assets (designer)
# -------------------------------------------------------

@router.post("/{task_id}/assets")
def upload_asset(
    task_id: int,
    data: AssetUpload,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]

    row = db.execute(
        text("SELECT id, title FROM tasks WHERE id = :tid"),
        {"tid": task_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    db.execute(
        text("UPDATE tasks SET git_branch = :url WHERE id = :tid"),
        {"url": data.asset_url, "tid": task_id}
    )
    db.commit()

    log_action(db, user_id, "ASSET_UPLOADED", {
        "task_id": task_id,
        "title": row[1],
        "asset_url": data.asset_url
    })

    return {"message": "Asset URL saved", "asset_url": data.asset_url}