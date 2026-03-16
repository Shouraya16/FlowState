from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth_api import router as auth_router

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)