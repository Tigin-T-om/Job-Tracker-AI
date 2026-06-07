# ---------------------------------------------------------------------------
# resume.py - Resume version database model
# Represents a single uploaded resume file in the user's Resume Repository.
# One resume version can be linked to many job applications, enabling
# performance tracking (callback rate, interview count) per version.
# ---------------------------------------------------------------------------
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_name = Column(String, nullable=False)  # Label, e.g. "Frontend Resume v2"
    filename = Column(String, nullable=False)     # Original uploaded name, e.g. "resume.pdf"
    file_path = Column(String, nullable=False)    # Disk storage location
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Define relationship back to Job (one resume version can link to multiple jobs)
    jobs = relationship("Job", back_populates="resume")
