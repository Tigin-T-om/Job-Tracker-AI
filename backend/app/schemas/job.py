from pydantic import BaseModel
from typing import Optional

class JobCreate(BaseModel):
    company_name: str
    role: str
    job_link: Optional[str] = None
    location: Optional[str] = None
    status: str
