# ---------------------------------------------------------------------------
# File: schemas/resume.py
# Description: Pydantic schemas for resume repository tracking, stats reporting,
#              and structured AI resume alignment analysis outputs.
# ---------------------------------------------------------------------------

from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ResumeBase(BaseModel):
    """
    Base properties for a resume file entry.
    """
    resume_name: str

class ResumeCreate(ResumeBase):
    """
    Schema for creating a new resume entry.
    """
    pass

class ResumeResponse(ResumeBase):
    """
    Standard response schema representing a stored resume profile.
    """
    id: int
    user_id: int
    filename: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeStatsResponse(ResumeResponse):
    """
    Response schema summarizing job search outcomes associated with a specific resume.
    """
    applications_count: int
    interview_count: int
    callback_rate: float

class AIAnalysisRequest(BaseModel):
    """
    Request payload containing the job description to run resume matching analysis against.
    """
    job_description: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    """
    Detailed results of the AI-powered resume comparison and scoring.
    """
    ats_score: int
    job_match_percentage: int
    missing_keywords: list[str]
    skills_gap: list[str]
    improvements: list[str]
    interview_prep: list[str]

