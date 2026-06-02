import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.ai import CoverLetterRequest, CoverLetterResponse
from app.services.ai import extract_text_from_pdf, generate_cover_letter_content

router = APIRouter()

@router.post("/cover-letter", response_model=CoverLetterResponse)
def generate_cover_letter(
    request_data: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Extracts resume content, sends it along with the job description to Gemini,
    and returns a professionally tailored cover letter.
    """
    resume = db.query(Resume).filter(
        Resume.id == request_data.resume_id, 
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Physical resume file not found on disk")
        
    try:
        # 1. Extract plain text from PDF
        resume_text = extract_text_from_pdf(resume.file_path)
        
        # 2. Generate cover letter content via Gemini
        cover_letter_text = generate_cover_letter_content(resume_text, request_data.job_description)
        
        return CoverLetterResponse(cover_letter=cover_letter_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cover letter: {str(e)}")
