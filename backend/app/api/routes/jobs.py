from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.job import Job
from app.models.job_status_history import JobStatusHistory
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobStatusHistoryResponse

router = APIRouter()

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(**job.model_dump())

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job

@router.get("/", response_model=list[JobResponse])
def get_jobs(db:Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return jobs

@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, updated_job: JobUpdate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    old_status = job.status
    update_data = updated_job.model_dump()

    for field, value in update_data.items():
        setattr(job, field, value)

    if old_status != updated_job.status:
        history_entry = JobStatusHistory(
            job_id=job.id,
            old_status=old_status,
            new_status=updated_job.status
        )
        db.add(history_entry)
    db.commit()
    db.refresh(job)

    return job

@router.get("/{job_id}/history", response_model=list[JobStatusHistoryResponse])
def get_job_status_history(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    history = (
        db.query(JobStatusHistory).filter(JobStatusHistory.job_id == job_id).order_by(JobStatusHistory.changed_at.desc()).all()
    )

    return history

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}
