from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
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
    resume_filename = Column(String, nullable=True)
    resume_filename = Column(String, nullable=True)