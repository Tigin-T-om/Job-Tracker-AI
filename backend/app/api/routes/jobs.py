from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_jobs():
    return {"jobs": [], "message": "List of jobs"}