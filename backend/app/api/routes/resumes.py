# ---------------------------------------------------------------------------
# resumes.py - Resume Repository API routes
# Manages the user's central resume repository. Supports uploading new
# versions, listing with performance stats, viewing/deleting files,
# and running AI-powered resume analysis via Gemini.
# ---------------------------------------------------------------------------
import io
import os
import shutil
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.resume import Resume
from app.models.job import Job
from app.models.user import User
from app.schemas.resume import ResumeResponse, ResumeStatsResponse, AIAnalysisRequest, AIAnalysisResponse
from app.services.ai import extract_text_from_pdf, analyze_resume_content
from app.services.storage import storage_service

router = APIRouter()

# ---- Upload a new resume version to the repository ----
@router.post("/", response_model=ResumeResponse)
def upload_resume_version(
    resume_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Read file content into memory bytes
    file_bytes = file.file.read()
    
    # Upload via storage service
    file_path = storage_service.upload_file(file_bytes, file.filename, current_user.id)
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

# ---- List all resumes with performance statistics ----
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

# ---- View / preview a resume document ----
@router.get("/{resume_id}/view")
def view_resume_file(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if resume.file_path.startswith("google_drive:"):
        try:
            file_bytes = storage_service.download_file(resume.file_path, current_user.id)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"inline; filename={resume.filename}"}
            )
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"File download failed: {str(e)}")
    else:
        if not os.path.exists(resume.file_path):
            raise HTTPException(status_code=404, detail="Physical file not found on disk")
        return FileResponse(path=resume.file_path)

# ---- Delete a resume version and unlink from all applications ----
@router.delete("/{resume_id}")
def delete_resume_file(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    storage_service.delete_file(resume.file_path, current_user.id)
        
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
        
    if not resume.file_path.startswith("google_drive:") and not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Physical resume file not found on disk")
        
    try:
    
        resume_text = extract_text_from_pdf(resume.file_path, current_user.id)
        analysis = analyze_resume_content(resume_text, request_data.job_description)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")
