from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.auth import router as auth_router
from app.api.routes.jobs import router as jobs_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": f"{settings.app_name} backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])

app.include_router(auth_router, prefix="/auth", tags=["Auth"])