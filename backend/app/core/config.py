# ---------------------------------------------------------------------------
# config.py - Centralised application configuration
# Uses pydantic-settings to load values from the .env file automatically.
# Each attribute maps to an environment variable of the same name.
# ---------------------------------------------------------------------------
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # General application metadata
    app_name: str = "Job Tracker AI"
    debug: bool = True
    database_url: str  # SQLite or PostgreSQL connection string
    frontend_url: str = "http://localhost:3000"

    # JWT authentication settings
    secret_key: str  # Used to sign and verify JSON Web Tokens
    algorithm: str = "HS256"  # JWT signing algorithm
    access_token_expire_minutes: int = 60

    # Google Gemini AI key for resume analysis and cover letter generation
    gemini_api_key: str = ""

    # File storage configuration
    storage_provider: str = "google_drive"  # Options: "local" or "google_drive"
    google_drive_folder_id: str = ""

    # Google OAuth 2.0 credentials for Drive integration
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""
    
    # Tells pydantic to read values from the .env file; ignores extra variables
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Singleton instance imported across the entire backend
settings = Settings()