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

class JobResponse(BaseModel):
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

    class Config:
        from_attributes = None