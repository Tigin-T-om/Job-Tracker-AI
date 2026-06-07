# ---------------------------------------------------------------------------
# File: schemas/ai.py
# Description: Pydantic schemas defining payloads for AI-related requests and
#              responses (e.g., cover letter generation parameters).
# ---------------------------------------------------------------------------

from pydantic import BaseModel

class CoverLetterRequest(BaseModel):
    """
    Schema for cover letter generation request parameters.
    """
    resume_id: int
    job_description: str

class CoverLetterResponse(BaseModel):
    """
    Schema containing the generated cover letter response.
    """
    cover_letter: str