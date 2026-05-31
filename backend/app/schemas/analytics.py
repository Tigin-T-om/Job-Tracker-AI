from pydantic import BaseModel
from typing import Dict, List

# Schema to represent statistics for a singe platform (e.g. LinkedIn)
class PlatformStat(BaseModel):
    source: str
    count: int
    responses: int
    interviews: int

# Schemas to represent the full dashboard response
class JobAnalyticsResponse(BaseModel):
    total_applications: int
    applications_this_month: int
    response_rate: float
    interview_rate: float
    offer_rate: float
    platform_stats: List[PlatformStat]
    status_stats: Dict[str, int]


