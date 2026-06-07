# ---------------------------------------------------------------------------
# File: schemas/reminder.py
# Description: Pydantic schemas representing system alert notifications and email
#              digest summary status checks.
# ---------------------------------------------------------------------------

from pydantic import BaseModel
from typing import Optional

class AlertResponse(BaseModel):
    """
    Schema for a single active system notification or status alert.
    """
    id: str                 # Unique alert ID (e.g., 'inactive_5', 'interview_2')
    type: str               # Alert type: 'inactive', 'interview', or 'followup'
    title: str              # User-facing short title of the alert
    message: str            # Detailed explanation or description of the alert
    job_id: Optional[int] = None # Linked job application database record ID
    days: Optional[int] = None   # Days remaining until due, or days elapsed since update

class EmailDigestResponse(BaseModel):
    """
    Schema representing the status outcome of sending a user email digest.
    """
    success: bool           # Indicates whether the email was sent successfully
    message: str           # Descriptive status message
    recipient: str         # Target email address recipient
    alert_count: int       # Number of active alerts packaged in the digest
