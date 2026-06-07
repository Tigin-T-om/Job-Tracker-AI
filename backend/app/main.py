# ---------------------------------------------------------------------------
# main.py - Application entry point
# Creates the FastAPI app instance, registers middleware, and mounts all
# API route modules under their respective URL prefixes.
# ---------------------------------------------------------------------------
from sys import prefix
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.auth import router as auth_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.interviews import router as interview_router
from app.api.routes.reminders import router as reminders_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.ai import router as ai_router
from app.core.config import settings

# Initialise the FastAPI application with the project title from config
app = FastAPI(title=settings.app_name)

# CORS middleware: allows the Next.js frontend (port 3000) to call this API.
# Without this, the browser would block cross-origin requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint - quick check that the server is running
@app.get("/")
def read_root():
    return {"message": f"{settings.app_name} backend is running"}


# Health-check endpoint for monitoring tools and deployment readiness probes
@app.get("/health")
def health_check():
    return {"status": "ok"}


# ---- Register all API route modules under their URL prefixes ----
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(interview_router, prefix="/interviews", tags=["Interviews"])
app.include_router(reminders_router, prefix="/reminders", tags=["Reminders"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(resumes_router, prefix="/resumes", tags=["Resumes"])
app.include_router(ai_router, prefix="/ai", tags=["AI"])
