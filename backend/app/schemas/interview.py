from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InterviewBase(BaseModel):
    round_type: str
    interview_date: datetime
    location_type: str
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class InterviewCreate(InterviewBase):
    job_id: int

class InterviewUpdate(InterviewBase):
    pass

class JobMinInfo(BaseModel):
    id: int
    company_name: str
    role: str

    class Config:
        from_attributes = True

class InterviewResponse(InterviewBase):
    id: int
    user_id: int
    job_id: int
    created_at: datetime
    updated_at: datetime
    job: Optional[JobMinInfo] = None

    class Config:
        from_attributes = True
