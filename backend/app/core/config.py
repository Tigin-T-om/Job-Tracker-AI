from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Job Tracker AI"
    debug: bool = True
    database_url: str
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()