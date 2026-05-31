from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ResumeBase(BaseModel):
    resume_name: str

class ResumeCreate(ResumeBase):
    pass

class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    filename: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

# Schema for checking stats: how many interviews this specific resume got!
class ResumeStatsResponse(ResumeResponse):
    applications_count: int
    interview_count: int
    callback_rate: float

# Schemas for AI Resume Analysis
class AIAnalysisRequest(BaseModel):
    job_description: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    ats_score: int
    job_match_percentage: int
    missing_keywords: list[str]
    skills_gap: list[str]
    improvements: list[str]
    interview_prep: list[str]

