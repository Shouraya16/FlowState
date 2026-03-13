import jwt
from datetime import datetime, timedelta

SECRET_KEY = "flowstate_secret"
ALGORITHM = "HS256"

def create_token(user_id: int):

    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token