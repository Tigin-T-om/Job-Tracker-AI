from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # General application metadata
    app_name: str = "Job Tracker AI"
    debug: bool = True
    database_url: str = "sqlite:///./jobs.db"  # SQLite or PostgreSQL connection string
    frontend_url: str = "http://localhost:3000"

    # JWT authentication settings
    secret_key: str = "dev-insecure-secret-key-change-in-production-12345"  # Used to sign and verify JSON Web Tokens
    algorithm: str = "HS256"  # JWT signing algorithm
    access_token_expire_minutes: int = 10080

    # Google Gemini AI key for resume analysis and cover letter generation
    gemini_api_key: str = ""

    # Optional HTTP Email API (e.g. Resend) for cloud environments where SMTP ports are blocked
    resend_api_key: str = ""

    # File storage configuration
    storage_provider: str = "local"  # Options: "local" or "google_drive"
    google_drive_folder_id: str = ""

    # Google OAuth 2.0 credentials for Drive integration
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    
    # Tells pydantic to read values from .env files; ignores extra variables
    model_config = SettingsConfigDict(
        env_file=(str(BASE_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Singleton instance imported across the entire backend
settings = Settings()
