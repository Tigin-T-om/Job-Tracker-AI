from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class JobCreate(BaseModel):
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: str
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None

class JobUpdate(BaseModel):
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: str
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None

class JobResponse(BaseModel):
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: str
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = None