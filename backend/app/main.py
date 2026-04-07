from fastapi import FastAPI
from app.api.routes.jobs import router as jobs_router
from app.core.config import settings
from app.db.database import engine
from app.db.base import Base
from app.models.job import Job

app = FastAPI(title=settings.app_name)

# CREATE TABLES
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": f"{settings.app_name} backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])