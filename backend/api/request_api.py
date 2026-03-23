from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schema import FeatureRequest, Client, FeatureRequestCreate, RequestStatus, User, UserType, Employee, EmployeeType
from utils.jwt_handler import decode_token

router = APIRouter(prefix="/requests", tags=["Feature Requests"])


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


@router.get("")
def get_requests(
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    user_id = token_data["user_id"]
    user = db.query(User).filter(User.id == user_id).first()

    # Clients only see their own requests
    if user.user_type == UserType.CLIENT:
        client = db.query(Client).filter(Client.user_id == user_id).first()
        if not client:
            return []
        requests = db.query(FeatureRequest).filter(
            FeatureRequest.client_id == client.id
        ).all()
    else:
        # Managers, admins, employees see all
        requests = db.query(FeatureRequest).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "status": r.status.value,
            "client_id": r.client_id
        }
        for r in requests
    ]


@router.patch("/{request_id}/status")
def update_status(
    request_id: int,
    status: str,
    db: Session = Depends(get_db),
    token_data=Depends(decode_token)
):
    # Only managers/admins can update status
    user_id = token_data["user_id"]
    user = db.query(User).filter(User.id == user_id).first()

    if user.user_type == UserType.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot update request status")

    req = db.query(FeatureRequest).filter(FeatureRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    try:
        req.status = RequestStatus(status)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid status")

    db.commit()
    return {"message": "Status updated", "new_status": req.status.value}