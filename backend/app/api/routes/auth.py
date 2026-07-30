# ---------------------------------------------------------------------------
# auth.py - Authentication and OAuth routes
# Handles user signup, login (JWT issuance), current-user lookup, and
# Google OAuth 2.0 flow for connecting the user's Google Drive account.
# ---------------------------------------------------------------------------
import secrets
import os

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # Allow HTTP for local dev OAuth

import secrets
from datetime import datetime, timedelta, timezone
from app.core.config import settings

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status

# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm

# pyrefly: ignore [missing-import]
from fastapi.responses import RedirectResponse

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.user_otp import UserOTP
from app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
)
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.email import send_html_email

# pyrefly: ignore [missing-import]
from google_auth_oauthlib.flow import Flow

router = APIRouter()


# ---- User Registration ----
@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account. Rejects duplicate emails."""
    existing_user = db.query(User).filter(User.email == user_data.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        mobile_number=user_data.mobile_number,
        age=user_data.age,
        hashed_password=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ---- User Login ----
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate with email/password. Returns a signed JWT access token."""
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ---- Current User Endpoint ----
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


# ---- Google OAuth: Step 1 - Generate Login URL ----
@router.get("/google/login-url")
def get_google_login_url(current_user: User = Depends(get_current_user)):
    """Build the Google OAuth consent URL and redirect the user to it.
    Uses PKCE for extra security; saves the code verifier to a temp file."""
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/oauth2/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }

    flow = Flow.from_client_config(
        client_config, scopes=["https://www.googleapis.com/auth/drive.file"]
    )
    flow.redirect_uri = settings.google_redirect_uri

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=str(current_user.id),
    )

    # Save the generated code verifier so the callback endpoint can use it
    verifier_path = f"google_drive_verifier_user_{current_user.id}.json"
    with open(verifier_path, "w") as f:
        f.write(flow.code_verifier)

    return {"url": authorization_url}


# ---- Google OAuth: Step 2 - Handle Callback ----
@router.get("/google/callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Google redirects here after the user grants permission.
    Exchanges the authorization code for access/refresh tokens and saves them."""
    import sys
    import json
    import requests as http_requests

    # pyrefly: ignore [missing-import]
    from google.oauth2.credentials import Credentials

    user_id = state
    print(f"\n--- DEBUG OAUTH CALLBACK ---", file=sys.stderr)
    print(f"Code: {code[:15]}...", file=sys.stderr)
    print(f"State (User ID): {user_id}", file=sys.stderr)
    # ---- Step 1: Load the PKCE code verifier (if it exists) ----
    # When we generated the login URL, the library created a "code_verifier"
    # (a random string used for security). We saved it to a file.
    # Now we need to send it back to Google to prove we're the same app
    # that started the login flow. This is called PKCE (Proof Key for Code Exchange).
    verifier_path = f"google_drive_verifier_user_{user_id}.json"
    code_verifier = None
    if os.path.exists(verifier_path):
        with open(verifier_path, "r") as f:
            code_verifier = f.read().strip()
        os.remove(verifier_path)  # One-time use, delete after reading
        print(f"Loaded verifier: {code_verifier[:15]}...", file=sys.stderr)
    else:
        print(f"WARNING: No verifier file found", file=sys.stderr)
    # ---- Step 2: Exchange the authorization code for tokens ----
    # This is the actual "token exchange". We send a POST request to Google
    # with the authorization code, and Google gives us back:
    #   - access_token:  lets us access Google Drive on behalf of the user
    #   - refresh_token: lets us get a new access_token when the old one expires
    token_url = "https://oauth2.googleapis.com/token"
    token_request_data = {
        "code": code,  # The code Google gave us in the callback URL
        "client_id": settings.google_client_id,  # Our app's ID (from Google Cloud Console)
        "client_secret": settings.google_client_secret,  # Our app's secret (from Google Cloud Console)
        "redirect_uri": settings.google_redirect_uri,  # Must match exactly what we used in Step 1
        "grant_type": "authorization_code",  # Tells Google we're exchanging a code for tokens
    }
    # If PKCE was used, include the code_verifier
    if code_verifier:
        token_request_data["code_verifier"] = code_verifier
    # Send the POST request to Google's token endpoint
    response = http_requests.post(token_url, data=token_request_data)
    token_json = response.json()
    print(f"Google token response status: {response.status_code}", file=sys.stderr)
    print(f"Google token response keys: {list(token_json.keys())}", file=sys.stderr)
    # ---- Step 3: Check if the exchange was successful ----
    if "access_token" not in token_json:
        print(f"ERROR: Token exchange failed!", file=sys.stderr)
        print(f"Google returned: {token_json}", file=sys.stderr)
        print(f"---------------------------\n", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Google token exchange failed: {token_json.get('error_description', token_json.get('error', 'Unknown error'))}",
        )
    # ---- Step 4: Create a Credentials object and save it ----
    # We create a Credentials object from Google's auth library.
    # This object knows how to refresh itself when the access_token expires.
    # We save it as a JSON file so our storage service can load it later.
    creds = Credentials(
        token=token_json["access_token"],  # The actual access token
        refresh_token=token_json.get("refresh_token"),  # Token to get new access tokens
        token_uri="https://oauth2.googleapis.com/token",  # Where to send refresh requests
        client_id=settings.google_client_id,  # Our app's ID
        client_secret=settings.google_client_secret,  # Our app's secret
        scopes=[
            "https://www.googleapis.com/auth/drive.file"
        ],  # What permissions we have
    )
    # Update the user's google_token in the database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user:
        user.google_token = creds.to_json()
        db.commit()
        print(f"SUCCESS! Token saved to database for user: {user_id}", file=sys.stderr)
    else:
        print(
            f"ERROR: User {user_id} not found in database to save token!",
            file=sys.stderr,
        )
    print(f"---------------------------\n", file=sys.stderr)
    return RedirectResponse(
        url=f"{settings.frontend_url}/profile?google_connected=true"
    )


# ---- Google OAuth: Step 3 - Connection Status ----
@router.get("/google/status")
def get_google_status(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Check if the user has a valid Google Drive integration connection."""
    from app.services.storage import storage_service

    service = storage_service._get_drive_service(current_user.id)
    return {"connected": service is not None}


# ---- Forgot Password: Step 1 - Request OTP ----
@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a 6-digit OTP, hash it, save to DB, and email it to the user.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Security best practice: return success even if user doesn't exist
        # to prevent email enumeration.
        return {
            "message": "If the email is registered, a password reset code has been sent."
        }

    # Generate 6-digit OTP
    otp_code = str(secrets.randbelow(900000) + 100000)

    # Hash the OTP using Bcrypt
    hashed_otp = hash_password(otp_code)

    # Set expiration to 10 minutes from now
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Save OTP record mapped to user_id
    otp_record = UserOTP(
        user_id=user.id, hashed_otp=hashed_otp, expires_at=expires_at, is_verified=False
    )
    db.add(otp_record)
    db.commit()

    # Send OTP email
    subject = "Your Password Reset OTP"
    html_content = f"""
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password. Use the following 6-digit One-Time Password (OTP) to complete the reset:</p>
    <h3 style="font-size: 24px; letter-spacing: 2px; color: #1a73e8; font-family: monospace;">{otp_code}</h3>
    <p>This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
    """

    send_html_email(to_email=user.email, subject=subject, html_body=html_content)

    return {
        "message": "If the email is registered, a password reset code has been sent."
    }


# ---- Forgot Password: Step 2 - Verify OTP ----
@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Check if the provided OTP is correct, unexpired, and not yet verified.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or code")

    # Get the latest active (unverified) OTP for this user
    otp_record = (
        db.query(UserOTP)
        .filter(UserOTP.user_id == user.id, UserOTP.is_verified.is_(False))
        .order_by(UserOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    # Verify expiration (timezone-aware safe comparison)
    now = datetime.now(timezone.utc)
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(status_code=400, detail="Code has expired")

    # Verify the OTP hash
    if not verify_password(payload.otp, otp_record.hashed_otp):
        raise HTTPException(status_code=400, detail="Invalid email or code")

    return {"message": "OTP verified successfully"}


# ---- Forgot Password: Step 3 - Reset Password ----
@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Verify OTP one final time, update user's password, and invalidate the OTP.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or code")

    # Get the latest active (unverified) OTP for this user
    otp_record = (
        db.query(UserOTP)
        .filter(UserOTP.user_id == user.id, UserOTP.is_verified == False)
        .order_by(UserOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    # Verify expiration
    now = datetime.now(timezone.utc)
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(status_code=400, detail="Code has expired")

    # Verify the OTP hash
    if not verify_password(payload.otp, otp_record.hashed_otp):
        raise HTTPException(status_code=400, detail="Invalid email or code")

    # All checks passed: Update user password
    user.hashed_password = hash_password(payload.new_password)

    # Invalidate OTP so it cannot be reused
    otp_record.is_verified = True

    db.commit()

    return {"message": "Password reset successfully"}
