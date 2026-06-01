import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Retrieve configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@jobtracker.ai")

def send_html_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Sends an HTML email. Falls back to console output if SMTP credentials are missing.
    """
    # Check if SMTP configuration is set up
    is_smtp_configured = all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD])

    if not is_smtp_configured:
        # Mock mode - print email details to the terminal
        print("\n" + "=" * 50)
        print(" [MOCK EMAIL NOTIFICATION SENT]")
        print(f" From:    {EMAIL_FROM}")
        print(f" To:      {to_email}")
        print(f" Subject: {subject}")
        print("-" * 50)
        print(html_body)
        print("=" * 50 + "\n")
        return True

    try:
        # Set up email message structure
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email

        # Attach HTML content
        part = MIMEText(html_body, "html")
        msg.attach(part)

        # Connect to SMTP server and send email
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()  # Upgrade connection to secure encrypted TLS
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(EMAIL_FROM, to_email, msg.as_string())
        server.quit()
        
        print(f"Email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email via SMTP: {e}")
        return False
