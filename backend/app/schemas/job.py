from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date, datetime

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
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: JobStatusType
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    resume_id: Optional[str] = None

class JobUpdate(BaseModel):
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: JobStatusType
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    resume_id: Optional[str] = None

class JobResponse(BaseModel):
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
    resume_id: Optional[str] = None


    class Config:
        from_attributes = True


class JobStatusHistoryResponse(BaseModel):
    id: int
    job_id: int
    old_status: str
    new_status: str
    changed_at: datetime

    class Config:
        from_attributes = True


class JobStatusCount(BaseModel):
    status: str
    count: int


class JobDashboardSummary(BaseModel):
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