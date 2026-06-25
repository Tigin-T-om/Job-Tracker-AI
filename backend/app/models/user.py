# ---------------------------------------------------------------------------
# user.py - User database model
# Represents a registered user account. Each user owns jobs, resumes,
# and interviews through foreign-key relationships.
# ---------------------------------------------------------------------------
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    jobs = relationship("Job", backref="owner")  # All jobs belonging to this user
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    mobile_number = Column(String, nullable=True)  # Optional contact number
    age = Column(Integer, nullable=True)  # Optional age field
    hashed_password = Column(String, nullable=False)  # Bcrypt hash, never stored plaintext
    google_token = Column(String, nullable=True)  # Store serialized Google OAuth credentials
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # Auto-set on creation