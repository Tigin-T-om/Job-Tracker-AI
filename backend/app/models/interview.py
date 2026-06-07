# ---------------------------------------------------------------------------
# interview.py - Interview round database model
# Represents a scheduled interview round (e.g. Technical, HR) linked to a
# specific job application. Stores date, location type, and optional notes.
# ---------------------------------------------------------------------------
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    round_type = Column(String, nullable=False)  # e.g. "Technical Interview", "HR Interview"
    interview_date = Column(DateTime(timezone=True), nullable=False)
    location_type = Column(String, nullable=False)  # "online" or "offline"
    meeting_link = Column(String, nullable=True)  # For online interviews (Zoom, Meet, etc.)
    location = Column(String, nullable=True)  # For offline interviews (office address)
    notes = Column(String, nullable=True)  # Preparation notes or panel info
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Back-reference to the parent Job record
    job = relationship("Job", back_populates="interviews")
