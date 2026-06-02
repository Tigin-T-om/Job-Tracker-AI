from pydantic import BaseModel

class CoverLetterRequest(BaseModel):
    resume_id: int
    job_description: str

class CoverLetterResponse(BaseModel):
    cover_letter: str