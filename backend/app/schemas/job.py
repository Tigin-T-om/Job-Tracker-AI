# ---------------------------------------------------------------------------
# File: schemas/job.py
# Description: Pydantic schemas representing job listings, updates, responses,
#              status audit logs, summaries, and Dashboard analytics counters.
# ---------------------------------------------------------------------------

from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date, datetime

# Enum for allowed job application status states
JobStatusType = Literal[
    "Applied",
    "No Response",
    "Callback Received",
    "Aptitude Test",
    "Technical Interview",
    "HR Interview",
    "Final Interview",
    "Offer Received",
    "Rejected"
]

class JobCreate(BaseModel):
    """
    Schema representing parameters to create a new job application.
    """
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: JobStatusType
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    resume_id: Optional[int] = None

class JobUpdate(BaseModel):
    """
    Schema representing parameters to update an existing job application.
    """
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: JobStatusType
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    resume_id: Optional[int] = None

class JobResponse(BaseModel):
    """
    Response schema returning complete information about a job application.
    """
    id: int
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: JobStatusType
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None 
    created_at: datetime
    updated_at: datetime
    resume_filename: Optional[str] = None
    resume_file_path: Optional[str] = None
    resume_id: Optional[int] = None
    resume_name: Optional[str] = None

    class Config:
        from_attributes = True

class JobStatusHistoryResponse(BaseModel):
    """
    Audit log response schema recording historical changes to application status.
    """
    id: int
    job_id: int
    old_status: str
    new_status: str
    changed_at: datetime

    class Config:
        from_attributes = True

class JobStatusCount(BaseModel):
    """
    Schema for mapping a single status category to its numerical frequency.
    """
    status: str
    count: int

class JobDashboardSummary(BaseModel):
    """
    Schema representing all aggregated counters shown on the main dashboard.
    """
    total_jobs: int
    applied: int
    no_response: int
    callback_received: int
    aptitude_test: int
    technical_interview: int
    hr_interview: int
    final_interview: int
    offer_received: int
    rejected: int
    overdue_follow_ups: int
    today_follow_ups: int
    upcoming_follow_ups: int