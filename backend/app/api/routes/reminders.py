from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.constants.job_status import ACTIVE_JOB_STATUSES
from app.core.dependencies import get_current_user
from app.core.email import send_html_email
from app.db.database import get_db
from app.models.interview import Interview
from app.models.job import Job
from app.models.user import User
from app.schemas.reminder import AlertResponse, EmailDigestResponse

router = APIRouter()


def get_active_alerts(db: Session, user_id: int) -> list[AlertResponse]:
    alerts = []
    today = date.today()
    now_dt = datetime.now()
    three_days_later = now_dt + timedelta(days=3)

    # 1. Fetch active jobs for the user
    active_jobs = (
        db.query(Job)
        .filter(Job.user_id == user_id)
        .filter(Job.status.in_(ACTIVE_JOB_STATUSES))
        .all()
    )

    for job in active_jobs:
        # Check follow-up date (Pending/Overdue)
        if job.follow_up_date:
            if job.follow_up_date <= today:
                days_overdue = (today - job.follow_up_date).days
                message = (
                    f"Follow-up for {job.role} at {job.company_name} is "
                    f"{'due today' if days_overdue == 0 else f'{days_overdue} days overdue'}."
                )
                alerts.append(
                    AlertResponse(
                        id=f"followup_{job.id}",
                        type="followup",
                        title="Follow-up Pending",
                        message=message,
                        job_id=job.id,
                        days=days_overdue,
                    )
                )

        # Check inactivity (No updates in >= 10 days)
        if job.updated_at:
            updated_date = job.updated_at.date()
            days_inactive = (today - updated_date).days
            if days_inactive >= 10:
                alerts.append(
                    AlertResponse(
                        id=f"inactive_{job.id}",
                        type="inactive",
                        title="Application Inactive",
                        message=f"No updates for {job.role} at {job.company_name} in {days_inactive} days. Consider following up!",
                        job_id=job.id,
                        days=days_inactive,
                    )
                )

    # 2. Fetch upcoming interviews in the next 3 days
    upcoming_interviews = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .filter(Interview.interview_date >= now_dt)
        .filter(Interview.interview_date <= three_days_later)
        .order_by(Interview.interview_date.asc())
        .all()
    )

    for interview in upcoming_interviews:
        # Time calculations
        time_diff = interview.interview_date.replace(tzinfo=None) - now_dt.replace(tzinfo=None)
        days_until = time_diff.days
        
        time_str = interview.interview_date.strftime("%I:%M %p")
        date_str = interview.interview_date.strftime("%A, %b %d")
        
        company = interview.job.company_name if interview.job else "Company"
        role = interview.job.role if interview.job else "Position"

        alerts.append(
            AlertResponse(
                id=f"interview_{interview.id}",
                type="interview",
                title="Upcoming Interview",
                message=f"Upcoming {interview.round_type} with {company} on {date_str} at {time_str}.",
                job_id=interview.job_id,
                days=days_until,
            )
        )

    return alerts


def generate_alerts_html_digest(user_name: str, alerts: list[AlertResponse]) -> str:
    alert_items_html = ""
    for alert in alerts:
        color = "#3b82f6"  # blue for interviews
        if alert.type == "followup":
            color = "#ef4444"  # red for followup
        elif alert.type == "inactive":
            color = "#f59e0b"  # orange for inactive
            
        alert_items_html += f"""
        <div style="border-left: 4px solid {color}; padding: 12px; margin-bottom: 12px; background-color: #f8fafc; border-radius: 4px;">
            <strong style="color: #1e293b; font-size: 16px;">{alert.title}</strong>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">{alert.message}</p>
        </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Job Application Digest</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">JobTracker.AI Alerts</h2>
            <p style="color: #334155; font-size: 15px;">Hello {user_name},</p>
            <p style="color: #334155; font-size: 15px;">Here is your job application reminder and digest summary for today:</p>
            
            <div style="margin-top: 20px; margin-bottom: 20px;">
                {alert_items_html if alerts else '<p style="color: #64748b; font-style: italic;">No active reminders or alerts today! Keep up the great work.</p>'}
            </div>
            
            <p style="color: #334155; font-size: 14px; margin-top: 30px;">
                Log in to <a href="http://localhost:3000" style="color: #3b82f6; text-decoration: none; font-weight: bold;">JobTracker.AI</a> to update your status, log interview feedback, or analyze resumes.
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;">
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                This is an automated reminder email sent from JobTracker.AI.
            </p>
        </div>
    </body>
    </html>
    """
    return html


@router.get("/alerts", response_model=list[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_active_alerts(db, current_user.id)


@router.post("/email-digest", response_model=EmailDigestResponse)
def send_email_digest(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alerts = get_active_alerts(db, current_user.id)
    email_html = generate_alerts_html_digest(current_user.name, alerts)
    
    subject = f"JobTracker.AI Reminders Summary - {len(alerts)} items pending"
    if not alerts:
        subject = "JobTracker.AI Digest - All clear!"

    success = send_html_email(current_user.email, subject, email_html)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email digest"
        )
        
    return EmailDigestResponse(
        success=True,
        message="Email digest dispatched successfully",
        recipient=current_user.email,
        alert_count=len(alerts)
    )
