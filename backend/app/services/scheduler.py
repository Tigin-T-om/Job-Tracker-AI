# ---------------------------------------------------------------------------
# scheduler.py - Background task scheduler using APScheduler
# Runs a daily background task to scan active alerts for all users
# and emails them their daily job tracker summaries.
# ---------------------------------------------------------------------------
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

# We import the session factory to manually open database connections
from app.db.database import SessionLocal

# Import database models
from app.models.user import User

# Import existing routing helpers for alerts and HTML formatting
from app.api.routes.reminders import get_active_alerts, generate_alerts_html_digest
from app.core.email import send_html_email

# Configure logging so we can see scheduler output in the terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Scheduler")

# Initialize the scheduler instance
scheduler = BackgroundScheduler()

def send_daily_digests():
    """
    Background worker function. Queries all users, checks if they have
    pending alerts (follow-ups/interviews), and sends a daily HTML email digest.
    """
    logger.info("⏰ Starting scheduled background job: Sending daily email digests...")
    
    # ⚠️ CRITICAL: Since this function runs on a background thread outside
    # of a FastAPI request, we cannot use Depends(get_db). We must manually
    # instantiate the database session and guarantee it closes using a try/finally block.
    db = SessionLocal()
    try:
        # 1. Fetch all registered users
        users = db.query(User).all()
        logger.info(f"Retrieved {len(users)} users for scan.")
        
        for user in users:
            # 2. Query alerts for this specific user
            alerts = get_active_alerts(db, user.id)
            
            # 3. Only send email if they have active alerts (no spam)
            if len(alerts) > 0:
                logger.info(f"User {user.name} ({user.email}) has {len(alerts)} pending alerts. Sending digest...")
                
                # 4. Generate the HTML template using our existing helper
                email_html = generate_alerts_html_digest(user.name, alerts)
                subject = f"JobTracker.AI Daily Reminder - {len(alerts)} items pending"
                
                # 5. Dispatch the email
                send_html_email(
                    to_email=user.email,
                    subject=subject,
                    html_body=email_html
                )
            else:
                logger.info(f"User {user.name} has no pending alerts today. Skipping email.")
                
    except Exception as e:
        logger.error(f"❌ Error during scheduled task: {str(e)}")
    finally:
        # Always close the manual session to prevent database pool exhaustion
        db.close()
        logger.info("🔌 Closed scheduled database session.")


def start_scheduler():
    """Starts the scheduler background thread and registers job schedules."""
    # Prevent starting multiple schedulers if already running
    if not scheduler.running:
        # Schedule the job to run every day at 8:00 AM
        trigger = CronTrigger(hour=8, minute=0)
        
        # NOTE FOR TESTING: If you want to test it immediately, you can change 
        # the trigger to run every minute instead:
        # trigger = CronTrigger(second=0) # Runs at the start of every minute
        
        scheduler.add_job(
            send_daily_digests,
            trigger=trigger,
            id="daily_digest_job",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("🚀 Background Scheduler started successfully.")


def shutdown_scheduler():
    """Safely shuts down the scheduler thread on application shutdown."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("🛑 Background Scheduler shut down successfully.")
