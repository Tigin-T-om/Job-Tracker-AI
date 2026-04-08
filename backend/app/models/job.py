from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Job(Base):
    __tablename__="jobs"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    role = Column(String)
    job_link = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(String)