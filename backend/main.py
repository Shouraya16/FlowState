from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import router
from api.auth_api import router as auth_router

# Import database setup
from database import Base, engine

# Import models so SQLAlchemy can detect tables
import schema

# Create FastAPI app
app = FastAPI(title="FlowState API")

# --------------------------------------------------
# Create database tables automatically
# --------------------------------------------------
Base.metadata.create_all(bind=engine)

# --------------------------------------------------
# Enable CORS (for React frontend)
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Include API routers
# --------------------------------------------------
app.include_router(auth_router)


# --------------------------------------------------
# Root endpoint
# --------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "FlowState backend is running"}