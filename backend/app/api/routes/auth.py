# ---------------------------------------------------------------------------
# auth.py - Authentication and OAuth routes
# Handles user signup, login (JWT issuance), current-user lookup, and
# Google OAuth 2.0 flow for connecting the user's Google Drive account.
# ---------------------------------------------------------------------------
import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # Allow HTTP for local dev OAuth

from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
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
            "redirect_uris": [settings.google_redirect_uri]
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=["https://www.googleapis.com/auth/drive.file"]
    )
    flow.redirect_uri = settings.google_redirect_uri
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=str(current_user.id)
    )
    
    # Save the generated code verifier so the callback endpoint can use it
    verifier_path = f"google_drive_verifier_user_{current_user.id}.json"
    with open(verifier_path, "w") as f:
        f.write(flow.code_verifier)
        
    return {"url": authorization_url}

# ---- Google OAuth: Step 2 - Handle Callback ----
@router.get("/google/callback")
def google_callback(code: str, state: str):
    """Google redirects here after the user grants permission.
    Exchanges the authorization code for access/refresh tokens and saves them."""
    import sys
    import json
    import requests as http_requests
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
        "code": code,                                    # The code Google gave us in the callback URL
        "client_id": settings.google_client_id,          # Our app's ID (from Google Cloud Console)
        "client_secret": settings.google_client_secret,  # Our app's secret (from Google Cloud Console)
        "redirect_uri": settings.google_redirect_uri,    # Must match exactly what we used in Step 1
        "grant_type": "authorization_code",              # Tells Google we're exchanging a code for tokens
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
            detail=f"Google token exchange failed: {token_json.get('error_description', token_json.get('error', 'Unknown error'))}"
        )
    # ---- Step 4: Create a Credentials object and save it ----
    # We create a Credentials object from Google's auth library.
    # This object knows how to refresh itself when the access_token expires.
    # We save it as a JSON file so our storage service can load it later.
    creds = Credentials(
        token=token_json["access_token"],                                   # The actual access token
        refresh_token=token_json.get("refresh_token"),                      # Token to get new access tokens
        token_uri="https://oauth2.googleapis.com/token",                    # Where to send refresh requests
        client_id=settings.google_client_id,                                # Our app's ID
        client_secret=settings.google_client_secret,                        # Our app's secret
        scopes=["https://www.googleapis.com/auth/drive.file"]               # What permissions we have
    )
    token_path = f"google_drive_token_user_{user_id}.json"
    with open(token_path, "w") as f:
        f.write(creds.to_json())
    print(f"SUCCESS! Token saved to: {token_path}", file=sys.stderr)
    print(f"---------------------------\n", file=sys.stderr)
    return RedirectResponse(url=f"{settings.frontend_url}/profile?google_connected=true")
