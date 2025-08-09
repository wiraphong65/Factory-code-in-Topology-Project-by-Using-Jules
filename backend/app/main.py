from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, projects, ai, analysis_history
from .database import engine
from . import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Network Topology API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(analysis_history.router, prefix="/analysis-history", tags=["analysis-history"])

@app.get("/")
def read_root():
    return {"message": "Network Topology API is running"} 