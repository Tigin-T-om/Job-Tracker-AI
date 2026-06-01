import os
import shutil
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.resume import Resume
from app.models.job import Job
from app.models.user import User
from app.schemas.resume import ResumeResponse, ResumeStatsResponse, AIAnalysisRequest, AIAnalysisResponse
from app.services.ai import extract_text_from_pdf, analyze_resume_content

router = APIRouter()

@router.post("/", response_model=ResumeResponse)
def upload_resume_version(
    resume_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename or "")[1]
    
    # Save file with unique timestamp to prevent name collisions
    import time
    saved_filename = f"user_{current_user.id}_repo_{int(time.time())}{file_ext}"
    file_path = os.path.join(upload_dir, saved_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_resume = Resume(
        user_id=current_user.id,
        resume_name=resume_name,
        filename=file.filename,
        file_path=file_path
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    return new_resume

@router.get("/", response_model=list[ResumeStatsResponse])
def get_resumes_with_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    stats = []
    
    for r in resumes:
        total_jobs = db.query(Job).filter(Job.resume_id == r.id).count()
        
        # Callbacks = Applications with status NOT in 'Applied' or 'No Response'
        callbacks = (
            db.query(Job)
            .filter(Job.resume_id == r.id)
            .filter(Job.status.notin_(["Applied", "No Response"]))
            .count()
        )
        
        # Interviews = reached an interview stage
        interview_statuses = [
            "Aptitude Test", 
            "Technical Interview", 
            "HR Interview", 
            "Final Interview", 
            "Offer Received"
        ]
        interviews = (
            db.query(Job)
            .filter(Job.resume_id == r.id)
            .filter(Job.status.in_(interview_statuses))
            .count()
        )
        
        callback_rate = round((callbacks / total_jobs) * 100, 1) if total_jobs > 0 else 0.0
        
        stats.append(
            ResumeStatsResponse(
                id=r.id,
                user_id=r.user_id,
                resume_name=r.resume_name,
                filename=r.filename,
                file_path=r.file_path,
                created_at=r.created_at,
                applications_count=total_jobs,
                interview_count=interviews,
                callback_rate=callback_rate
            )
        )
        
    return stats

@router.get("/{resume_id}/view")
def view_resume_file(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Physical file not found on disk")
        
    return FileResponse(path=resume.file_path)

@router.delete("/{resume_id}")
def delete_resume_file(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Safely remove the file from local storage
    try:
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)
    except Exception as e:
        print(f"Error removing file from disk: {e}")
        
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully"}

@router.post("/{resume_id}/analyze", response_model=AIAnalysisResponse)
def analyze_resume(
    resume_id: int,
    request_data: AIAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Parses a resume version PDF, runs ATS format checks, comparisons against
    the job description via Gemini, and returns structured feedback.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Physical resume file not found on disk")
        
    try:
        # 1. Extract plain text from PDF
        resume_text = extract_text_from_pdf(resume.file_path)
        
        # 2. Perform analysis via Gemini
        analysis = analyze_resume_content(resume_text, request_data.job_description)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")
