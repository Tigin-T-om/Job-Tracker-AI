from pydantic import BaseModel
from typing import Optional

class AlertResponse(BaseModel):
    id: str                 # Unique alert ID (e.g., 'inactive_5', 'interview_2')
    type: str               # 'inactive', 'interview', or 'followup'
    title: str              # Title of the alert
    message: str            # Friendly descriptive alert message
    job_id: Optional[int] = None
    days: Optional[int] = None  # Days remaining or days since last update

class EmailDigestResponse(BaseModel):
    success: bool
    message: str
    recipient: str
    alert_count: int
