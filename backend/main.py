from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth_api import router as auth_router
from api.request_api import router as request_router
from api.task_api import router as task_router
from api.qa_api import router as qa_router

from database import Base, engine
import schema

app = FastAPI(title="FlowState API")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(request_router)
app.include_router(task_router)
app.include_router(qa_router)


@app.get("/")
def read_root():
    return {"message": "FlowState backend is running"}