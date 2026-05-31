from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.job import Job
from app.models.user import User
from app.schemas.analytics import JobAnalyticsResponse, PlatformStat

router = APIRouter()

@router.get("/", response_model=JobAnalyticsResponse)
def get_job_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Total applications for the user
    total_apps = db.query(Job).filter(Job.user_id == current_user.id).count()

    # 2. Applications submitted in the last 30 days
    thirty_days_ago = date.today() - timedelta(days=30)
    apps_this_month = (
        db.query(Job)
        .filter(Job.user_id == current_user.id)
        .filter(Job.applied_date >= thirty_days_ago)
        .count()
    )

    # If the user has no applications, return clean empty stats to avoid DivisionByZero
    if total_apps == 0:
        return JobAnalyticsResponse(
            total_applications=0,
            applications_this_month=0,
            response_rate=0.0,
            interview_rate=0.0,
            offer_rate=0.0,
            platform_stats=[],
            status_stats={}
        )

    # 3. Responses: Any status except 'Applied' or 'No Response'
    responded_apps = (
        db.query(Job)
        .filter(Job.user_id == current_user.id)
        .filter(Job.status.notin_(["Applied", "No Response"]))
        .count()
    )

    # 4. Interviews: Any active interview round or offers/rejections that went through interviews
    interview_statuses = [
        "Aptitude Test",
        "Technical Interview",
        "HR Interview",
        "Final Interview",
    ]
    interview_apps = (
        db.query(Job)
        .filter(Job.user_id == current_user.id)
        .filter(Job.status.in_(interview_statuses + ["Offer Received"]))
        .count()
    )

    # 5. Offers Received
    offer_apps = (
        db.query(Job)
        .filter(Job.user_id == current_user.id)
        .filter(Job.status == "Offer Received")
        .count()
    )

    # 6. Platform distribution (source grouping)
    # This runs a SQL SELECT source, COUNT(id) FROM jobs GROUP BY source query
    platforms_query = (
        db.query(
            Job.source,
            func.count(Job.id).label("count"),
            func.sum(func.case((Job.status.notin_(["Applied", "No Response"]), 1), else_=0)).label("responses"),
            func.sum(func.case((Job.status.in_(interview_statuses + ["Offer Received"]), 1), else_=0)).label("interviews"),
        )
        .filter(Job.user_id == current_user.id)
        .group_by(Job.source)
        .all()
    )

    platform_stats = []
    for source, count, responses, interviews in platforms_query:
        source_name = source if source else "Direct / Other"
        platform_stats.append(
            PlatformStat(
                source=source_name,
                count=count,
                responses=int(responses or 0),
                interviews=int(interviews or 0),
            )
        )

    # 7. Status breakdown distribution
    status_query = (
        db.query(Job.status, func.count(Job.id))
        .filter(Job.user_id == current_user.id)
        .group_by(Job.status)
        .all()
    )
    status_stats = {status: count for status, count in status_query}

    # Return validated schema response
    return JobAnalyticsResponse(
        total_applications=total_apps,
        applications_this_month=apps_this_month,
        response_rate=round((responded_apps / total_apps) * 100, 1),
        interview_rate=round((interview_apps / total_apps) * 100, 1),
        offer_rate=round((offer_apps / total_apps) * 100, 1),
        platform_stats=platform_stats,
        status_stats=status_stats
    )
