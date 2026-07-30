# ---------------------------------------------------------------------------
# user_otp.py - Database model for storing hashed user OTPs
# Stores cryptographically hashed OTP values mapped to immutable User IDs
# for secure password recovery.
# ---------------------------------------------------------------------------
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from app.db.base import Base

class UserOTP(Base):
    __tablename__ = "user_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hashed_otp = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())