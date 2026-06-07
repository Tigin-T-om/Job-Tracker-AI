# ---------------------------------------------------------------------------
# File: schemas/interview.py
# Description: Pydantic models representing base, creation, update, and response
#              schemas for job interviews, supporting ORM mapping serialization.
# ---------------------------------------------------------------------------

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InterviewBase(BaseModel):
    """
    Base attributes shared across all interview schemas.
    """
    round_type: str
    interview_date: datetime
    location_type: str
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class InterviewCreate(InterviewBase):
    """
    Schema for creating a new interview linked to a specific job ID.
    """
    job_id: int

class InterviewUpdate(InterviewBase):
    """
    Schema for updating details of an existing interview.
    """
    pass

class JobMinInfo(BaseModel):
    """
    Minimal job description returned inside interview responses.
    """
    id: int
    company_name: str
    role: str

    class Config:
        from_attributes = True

class InterviewResponse(InterviewBase):
    """
    Detailed response schema containing complete interview and associated job information.
    """
    id: int
    user_id: int
    job_id: int
    created_at: datetime
    updated_at: datetime
    job: Optional[JobMinInfo] = None

    class Config:
        from_attributes = True
