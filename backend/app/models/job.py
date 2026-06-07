# ---------------------------------------------------------------------------
# job.py - Job application database model
# Represents a single job application entry. Tracks company, role, status,
# follow-up dates, linked resume, and maintains a history of status changes.
# ---------------------------------------------------------------------------
from typing import Optional
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Job(Base):
    __tablename__="jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Owner of this application
    company_name = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)
    job_link = Column(String, nullable=True)  # URL to the job posting
    location = Column(String, nullable=True)
    source = Column(String, nullable=True)  # Where the job was found (e.g. LinkedIn)
    status = Column(String, nullable=False)  # Current pipeline stage
    applied_date = Column(Date, nullable=True)
    follow_up_date = Column(Date, nullable=True)  # When to follow up next
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Old legacy columns (keep for backwards compatibility)
    resume_filename = Column(String, nullable=True)
    resume_file_path = Column(String, nullable=True)
    
    # Links to the central Resume Repository; SET NULL if the resume is deleted
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    # One job can have many interview rounds; deleting a job removes its interviews
    interviews = relationship("Interview", back_populates="job", cascade="all, delete-orphan")
    
    # Relationship to fetch the linked Resume object directly
    resume = relationship("Resume", back_populates="jobs")

    @property
    def resume_name(self) -> Optional[str]:
        """Convenience accessor to get the linked resume's label."""
        return self.resume.resume_name if self.resume else None

