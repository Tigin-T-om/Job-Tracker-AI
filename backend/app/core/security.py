# ---------------------------------------------------------------------------
# security.py - Password hashing and JWT token utilities
# Provides helper functions used by the auth routes to hash passwords,
# verify login credentials, and create signed access tokens.
# ---------------------------------------------------------------------------
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Bcrypt context used for one-way password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plaintext password. Truncates to 72 chars (bcrypt limit)."""
    return pwd_context.hash(password[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare a plaintext password against its stored hash. Returns True if they match."""
    return pwd_context.verify(plain_password[:72], hashed_password)

def create_access_token(data: dict) -> str:
    """Generate a signed JWT containing the supplied claims and an expiry timestamp."""
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )

    return encoded_jwt