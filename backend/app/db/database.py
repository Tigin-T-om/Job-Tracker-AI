# ---------------------------------------------------------------------------
# database.py - SQLAlchemy database engine and session factory
# Creates the database engine from the connection string in config and
# provides a get_db() generator used as a FastAPI dependency to supply
# a database session to each request.
# ---------------------------------------------------------------------------
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create the database engine using the URL from .env (e.g. sqlite:///./jobs.db)
engine = create_engine(settings.database_url)

# Session factory - each call produces an independent database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Yield a database session and ensure it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()