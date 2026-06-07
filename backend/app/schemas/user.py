# ---------------------------------------------------------------------------
# File: schemas/user.py
# Description: Pydantic schemas representing user registration, login payloads,
#              user detail responses, and OAuth2 JWT authentication tokens.
# ---------------------------------------------------------------------------

from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    """
    Schema representing user registration payload parameters.
    """
    name: str
    email: EmailStr
    password: str
    mobile_number: Optional[str] = None
    age: Optional[int] = None

class UserLogin(BaseModel):
    """
    Schema representing credentials required for authentication login.
    """
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """
    Response schema returning details of a registered user.
    """
    id: int
    name: str
    email: EmailStr
    mobile_number: Optional[str] = None
    age: Optional[int] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    """
    Response schema containing OAuth2 access token details.
    """
    access_token: str
    token_type: str