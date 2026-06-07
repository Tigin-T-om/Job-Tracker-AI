# ---------------------------------------------------------------------------
# File: constants/job_status.py
# Description: Defines global constant lists for job status categories,
#              separating all statuses from active tracking statuses.
# ---------------------------------------------------------------------------

# Full list of possible states for a job application
JOB_STATUSES = [
    "Applied",
    "No Response",
    "Callback Received",
    "Aptitude Test",
    "Techinical Interview",
    "HR Interview",
    "Final Interview",
    "Offer Received",
    "Rejected"
]

# States that indicate the application is still actively in progress
# (i.e. has not concluded in either an offer or a rejection)
ACTIVE_JOB_STATUSES = [
    "Applied",
    "No Response",
    "Callback Received",
    "Aptitude Test",
    "Techinical Interview",
    "HR Interview",
    "Final Interview"
]