import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("dynamic_pricing")

# Email Configuration from environment
SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@dynamicpricing.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

def send_verification_email(to_email: str, token: str):
    link = f"{FRONTEND_URL}/verify-email?token={token}"
    subject = "Verify Your Email - Dynamic Pricing System"
    body = f"Welcome! \n\nPlease verify your email by clicking the link:\n{link}\n\nIf you did not register, please ignore this email."
    
    if not SMTP_SERVER or not SMTP_USER:
        # Mock email if no SMTP config is provided
        logger.info(f"========== MOCK EMAIL ==========")
        logger.info(f"Verification Email intended for: {to_email}")
        logger.info(f"Link: {link}")
        logger.info(f"================================")
        return
        
    _send_email(to_email, subject, body)

def send_reset_password_email(to_email: str, token: str):
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset Your Password - Dynamic Pricing System"
    body = f"You requested a password reset. \n\nClick the link below to reset your password:\n{link}\n\nIf you did not request this, please ignore this email."
    
    if not SMTP_SERVER or not SMTP_USER:
        # Mock email if no SMTP config is provided
        logger.info(f"========== MOCK EMAIL ==========")
        logger.info(f"Reset Password Email intended for: {to_email}")
        logger.info(f"Link: {link}")
        logger.info(f"================================")
        return
        
    _send_email(to_email, subject, body)

def _send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = SMTP_FROM
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
