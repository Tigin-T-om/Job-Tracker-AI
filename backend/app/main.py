from fastapi import FastAPI
from app.api.routes.jobs import router as jobs_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)

@app.get("/")
def read_root():
    return {"message": f"{settings.app_name} backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])