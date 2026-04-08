from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse

router = APIRouter()

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(
        company_name=job.company_name,
        role=job.role,
        job_link=job.job_link,
        location=job.location,
        status=job.status
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job

@router.get("/", response_model=list[JobResponse])
def get_jobs(db:Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return jobs