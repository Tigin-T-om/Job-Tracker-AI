# ---------------------------------------------------------------------------
# interviews.py - Interview scheduling CRUD API routes
# Manages interview rounds linked to job applications. Supports creating,
# listing, updating, and deleting interview entries.
# ---------------------------------------------------------------------------
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.interview import Interview
from app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewResponse

router = APIRouter()

def get_user_interview_or_404(interview_id: int, db: Session, current_user: User) -> Interview:
    """Fetch an interview by ID, ensuring it belongs to the current user."""
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id)
        .filter(Interview.user_id == current_user.id)
        .first()
    )
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return interview

# ---- Schedule a new interview round ----
@router.post("/", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    interview_in: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify the job exists and belongs to the current user
    job = (
        db.query(Job)
        .filter(Job.id == interview_in.job_id)
        .filter(Job.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    new_interview = Interview(
        **interview_in.model_dump(),
        user_id=current_user.id,
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return new_interview

# ---- List all interviews for the current user ----
@router.get("/", response_model=list[InterviewResponse])
def get_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.interview_date.asc())
        .all()
    )
    return interviews

@router.get("/job/{job_id}", response_model=list[InterviewResponse])
def get_interviews_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify job belongs to user
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .filter(Job.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
        
    interviews = (
        db.query(Interview)
        .filter(Interview.job_id == job_id)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.interview_date.asc())
        .all()
    )
    return interviews

@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_interview_or_404(interview_id, db, current_user)

# ---- Update an existing interview ----
@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    interview_in: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = get_user_interview_or_404(interview_id, db, current_user)
    
    update_data = interview_in.model_dump()
    for field, value in update_data.items():
        setattr(interview, field, value)
        
    db.commit()
    db.refresh(interview)
    return interview

# ---- Delete / cancel an interview ----
@router.delete("/{interview_id}")
def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = get_user_interview_or_404(interview_id, db, current_user)
    db.delete(interview)
    db.commit()
    return {"message": "Interview deleted successfully"}
