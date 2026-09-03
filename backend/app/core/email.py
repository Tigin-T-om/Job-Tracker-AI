# ---------------------------------------------------------------------------
# email.py - Email dispatch service
# Supports:
#   1. Resend REST API (over HTTPS port 443 - works on Hugging Face Spaces)
#   2. Standard SMTP (for environments where port 587 is unblocked)
#   3. Console log fallback (prints OTP to logs if network is blocked)
# ---------------------------------------------------------------------------
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from dotenv import load_dotenv

load_dotenv()

# Retrieve configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@jobtracker.ai")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")


def _send_via_resend(api_key: str, to_email: str, subject: str, html_body: str) -> bool:
    """Send email via Resend REST API over HTTPS (Port 443 - works on Hugging Face Spaces)."""
    try:
        # Resend rejects public email domains like @gmail.com.
        # It requires 'onboarding@resend.dev' unless you have a verified custom domain.
        resend_from = os.getenv("RESEND_FROM_EMAIL")
        if resend_from and not any(resend_from.endswith(d) for d in ("@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com")):
            from_addr = resend_from
        else:
            from_addr = "onboarding@resend.dev"

        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"Job Tracker AI <{from_addr}>",
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            },
            timeout=10,
        )
        if response.status_code in (200, 201):
            print(f"[Email Service] Successfully sent email to {to_email} via Resend HTTP API")
            return True
        else:
            print(f"[Email Service] Resend API returned status {response.status_code}: {response.text}")
            return False
    except Exception as ex:
        print(f"[Email Service] Error calling Resend API: {ex}")
        return False


def _print_fallback_log(to_email: str, subject: str, html_body: str, reason: str = "Mock Mode"):
    """Log the email content to console so users can access OTPs during local dev or when cloud ports are blocked."""
    print("\n" + "=" * 60)
    print(f" [EMAIL DISPATCH LOG - {reason.upper()}]")
    print(f" From:    {EMAIL_FROM}")
    print(f" To:      {to_email}")
    print(f" Subject: {subject}")
    print("-" * 60)
    print(html_body)
    print("=" * 60 + "\n")


def send_html_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Sends an HTML email using available providers:
    1. Resend REST API (HTTPS port 443, recommended for Hugging Face Spaces)
    2. Standard SMTP (ports 587 / 465, for local dev or unblocked servers)
    3. Console log fallback (allows viewing OTPs even if network is unreachable)
    """
    # 1. Check if Resend API key is configured
    if RESEND_API_KEY:
        if _send_via_resend(RESEND_API_KEY, to_email, subject, html_body):
            return True
        print("[Email Service] Resend API failed. Falling back to SMTP or console log...")

    # 2. Check if SMTP configuration is set up
    is_smtp_configured = all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD])

    if not is_smtp_configured:
        _print_fallback_log(to_email, subject, html_body, reason="Mock Mode (SMTP not configured)")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        # Connect to SMTP server
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(EMAIL_FROM, to_email, msg.as_string())
        server.quit()

        print(f"[Email Service] Email successfully sent to {to_email} via SMTP")
        return True
    except Exception as e:
        print(f"[ERROR] Error sending email via SMTP: {e}")
        print("[WARNING] Note: Cloud providers like Hugging Face Spaces block outbound SMTP ports (25, 465, 587).")
        print("[INFO] Falling back to logging email content so OTP can still be used:")
        _print_fallback_log(to_email, subject, html_body, reason="Fallback (SMTP Network Blocked)")
        return False
