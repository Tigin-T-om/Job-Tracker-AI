# ---------------------------------------------------------------------------
# File: schemas/analytics.py
# Description: Pydantic schemas for structured job search analytics, including
#              rates, platform distribution stats, and status metrics.
# ---------------------------------------------------------------------------

from pydantic import BaseModel
from typing import Dict, List

class PlatformStat(BaseModel):
    """
    Schema representing job search stats for a specific source/platform.
    """
    source: str
    count: int
    responses: int
    interviews: int

class JobAnalyticsResponse(BaseModel):
    """
    Schema representing aggregated job search performance metrics and status breakdown.
    """
    total_applications: int
    applications_this_month: int
    response_rate: float
    interview_rate: float
    offer_rate: float
    platform_stats: List[PlatformStat]
    status_stats: Dict[str, int]


