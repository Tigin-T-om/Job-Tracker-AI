# ---------------------------------------------------------------------------
# File: db/base.py
# Description: Defines the SQLAlchemy declarative Base class used as the parent
#              for all database models in the application.
# ---------------------------------------------------------------------------

from sqlalchemy.ext.declarative import declarative_base

# Shared declarative base class that maps our Python classes to database tables
Base = declarative_base()