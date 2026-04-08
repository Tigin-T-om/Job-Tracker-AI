from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate, JobResponse

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

@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, updated_job: JobUpdate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.company_name = updated_job.company_name
    job.role = updated_job.role
    job.job_link = updated_job.job_link
    job.location = updated_job.location
    job.status = updated_job.status

    db.commit()
    db.refresh(job)

    return job

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}
