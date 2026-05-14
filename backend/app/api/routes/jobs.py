import os
import shutil

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi import UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.constants.job_status import ACTIVE_JOB_STATUSES
from app.db.database import get_db
from app.models.job import Job
from app.models.job_status_history import JobStatusHistory
from sqlalchemy import func
from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobStatusHistoryResponse,
    JobStatusCount,
    JobDashboardSummary
)

router = APIRouter()


@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(**job.model_dump())

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


@router.get("/", response_model=list[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return jobs


@router.get("/follow-ups/overdue", response_model=list[JobResponse])
def get_overdue_follow_ups(db: Session = Depends(get_db)):
    today = date.today()

    jobs = (
        db.query(Job)
        .filter(Job.follow_up_date.isnot(None))
        .filter(Job.follow_up_date < today)
        .filter(Job.status.in_(ACTIVE_JOB_STATUSES))
        .order_by(Job.follow_up_date.asc())
        .all()
    )

    return jobs


@router.get("/follow-ups/today", response_model=list[JobResponse])
def get_today_follow_ups(db: Session = Depends(get_db)):
    today = date.today()

    jobs = (
        db.query(Job)
        .filter(Job.follow_up_date == today)
        .filter(Job.status.in_(ACTIVE_JOB_STATUSES))
        .order_by(Job.created_at.desc())
        .all()
    )

    return jobs


@router.get("/follow-ups/upcoming", response_model=list[JobResponse])
def get_upcoming_follow_ups(days: int = 7, db: Session = Depends(get_db)):
    today = date.today()
    end_date = today + timedelta(days=days)

    jobs = (
        db.query(Job)
        .filter(Job.follow_up_date.isnot(None))
        .filter(Job.follow_up_date > today)
        .filter(Job.follow_up_date <= end_date)
        .filter(Job.status.in_(ACTIVE_JOB_STATUSES))
        .order_by(Job.follow_up_date.asc())
        .all()
    )

    return jobs

@router.get("/dashboard/summary", response_model=JobDashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    upcoming_end_date = today + timedelta(days=7)

    total_jobs = db.query(Job).count()

    applied = db.query(Job).filter(Job.status == "Applied").count()
    no_response = db.query(Job).filter(Job.status == "No Response").count()
    callback_received = db.query(Job).filter(Job.status == "Callback Received").count()
    aptitude_test = db.query(Job).filter(Job.status == "Aptitude Test").count()
    technical_interview = db.query(Job).filter(Job.status == "Technical Interview").count()
    hr_interview = db.query(Job).filter(Job.status == "HR Interview").count()
    final_interview = db.query(Job).filter(Job.status == "Final Interview").count()
    offer_received = db.query(Job).filter(Job.status == "Offer Received").count()
    rejected = db.query(Job).filter(Job.status == "Rejected").count()

    overdue_follow_ups = (
        db.query(Job)
        .filter(Job.follow_up_date.isnot(None))
        .filter(Job.follow_up_date < today)
        .filter(Job.status.in_(ACTIVE_JOB_STATUSES))
        .count()
    )

    today_follow_ups = (
        db.query(Job)
        .filter(Job.follow_up_date == today)
        .filter(Job.status.in_(ACTIVE_JOB_STATUSES))
        .count()
    )

    upcoming_follow_ups = (
        db.query(Job)
        .filter(Job.follow_up_date.isnot(None))
        .filter(Job.follow_up_date > today)
        .filter(Job.follow_up_date <= upcoming_end_date)
        .filter(Job.status.in_(ACTIVE_JOB_STATUSES))
        .count()
    )

    return JobDashboardSummary(
        total_jobs=total_jobs,
        applied=applied,
        no_response=no_response,
        callback_received=callback_received,
        aptitude_test=aptitude_test,
        technical_interview=technical_interview,
        hr_interview=hr_interview,
        final_interview=final_interview,
        offer_received=offer_received,
        rejected=rejected,
        overdue_follow_ups=overdue_follow_ups,
        today_follow_ups=today_follow_ups,
        upcoming_follow_ups=upcoming_follow_ups,
    )

@router.get("/dashboard/status-counts", response_model=list[JobStatusCount])
def get_status_counts(db: Session = Depends(get_db)):
    results = (
        db.query(Job.status, func.count(Job.id))
        .group_by(Job.status)
        .order_by(Job.status.asc())
        .all()
    )

    return [
        JobStatusCount(status=status, count=count)
        for status, count in results
    ]

@router.get("/dashboard/interviews", response_model=list[JobResponse])
def get_interview_stage_jobs(db: Session = Depends(get_db)):
    interview_statuses = [
        "Aptitude Test",
        "Technical Interview",
        "HR Interview",
        "Final Interview",
    ]

    jobs = (
        db.query(Job)
        .filter(Job.status.in_(interview_statuses))
        .order_by(Job.updated_at.desc())
        .all()
    )

    return jobs

@router.post("/{job_id}/resume", response_model=JobResponse)
def upload_resume(
    job_id: int,
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = os.path.splitext(resume.filename)[1]
    saved_filename = f"job_{job_id}_resume{file_extension}"
    file_path = os.path.join(upload_dir, saved_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)

    job.resume_filename = resume.filename
    job.resume_file_path = file_path

    db.commit()
    db.refresh(job)

    return job

@router.get("/{job_id}/resume/download")
def download_resume(job_id: int, db:Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job or not job.resume_file_path:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return FileResponse(
        path=job.resume_file_path,
        filename=job.resume_filename,
        media_type="application/octet-stream",
    )

@router.get("/{job_id}/resume/view")
def view_resume(job_id: int, db:Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job or not job.resume_file_path:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return FileResponse(path=job.resume_file_path)

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job


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
        db.query(JobStatusHistory)
        .filter(JobStatusHistory.job_id == job_id)
        .order_by(JobStatusHistory.changed_at.desc())
        .all()
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