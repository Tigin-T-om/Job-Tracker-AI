# ---------------------------------------------------------------------------
# job_status_history.py - Status change audit log model
# Records every status transition for a job application (e.g. Applied -> 
# Callback Received). This creates a full timeline of pipeline progress.
# ---------------------------------------------------------------------------
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class JobStatusHistory(Base):
    __tablename__ = "job_status_history"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String, nullable=False)  # Status before the change
    new_status = Column(String, nullable=False)  # Status after the change
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)