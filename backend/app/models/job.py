from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Job(Base):
    __tablename__="jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) 
    company_name = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)
    job_link = Column(String, nullable=True)
    location = Column(String, nullable=True)
    source = Column(String, nullable=True)
    status = Column(String, nullable=False)
    applied_date = Column(Date, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Old legacy columns (keep for backwards compatibility)
    resume_filename = Column(String, nullable=True)
    resume_file_path = Column(String, nullable=True)
    
    # NEW: Link to the Resume Repository
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    interviews = relationship("Interview", back_populates="job", cascade="all, delete-orphan")
    
    # NEW: Relationship to fetch Resume objects directly on a Job
    resume = relationship("Resume", back_populates="jobs")
