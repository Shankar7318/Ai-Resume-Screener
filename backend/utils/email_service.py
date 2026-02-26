import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL", "")
        self.sender_password = os.getenv("SENDER_PASSWORD", "")
        
        if not self.sender_email or not self.sender_password:
            logger.warning("Email credentials not configured. Emails will be logged but not sent.")
    
    def send_email(self, to_email: str, subject: str, body: str, html: bool = False) -> bool:
        """Send single email"""
        if not self.sender_email or not self.sender_password:
            logger.info(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}, Body: {body[:100]}...")
            return True
        
        try:
            msg = MIMEMultipart()
            msg["From"] = self.sender_email
            msg["To"] = to_email
            msg["Subject"] = subject
            
            if html:
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def send_bulk_emails(self, to_emails: List[str], subject: str, body: str) -> int:
        """Send bulk emails"""
        success_count = 0
        for email in to_emails:
            if self.send_email(email, subject, body):
                success_count += 1
        return success_count
    
    def send_interview_invitation(self, to_email: str, candidate_name: str, 
                                  date: str, time: str, interview_type: str) -> bool:
        """Send interview invitation email"""
        subject = f"Interview Invitation - {candidate_name}"
        
        body = f"""
        Dear {candidate_name},
        
        We are pleased to invite you for an interview for the position you applied for.
        
        Interview Details:
        - Date: {date}
        - Time: {time}
        - Type: {interview_type}
        
        Please confirm your availability by replying to this email.
        
        Best regards,
        HR Team
        AI Resume Screener
        """
        
        return self.send_email(to_email, subject, body)
    
    def send_selection_email(self, to_email: str, candidate_name: str) -> bool:
        """Send selection notification"""
        subject = f"Congratulations! You've been selected"
        
        body = f"""
        Dear {candidate_name},
        
        Congratulations! We are pleased to inform you that you have been selected for the position.
        
        Our HR team will contact you shortly with the next steps.
        
        Best regards,
        HR Team
        AI Resume Screener
        """
        
        return self.send_email(to_email, subject, body)
    
    def send_rejection_email(self, to_email: str, candidate_name: str) -> bool:
        """Send rejection notification"""
        subject = f"Update on your application"
        
        body = f"""
        Dear {candidate_name},
        
        Thank you for your interest in our company and for taking the time to apply.
        
        After careful review of your application, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.
        
        We wish you success in your job search and future endeavors.
        
        Best regards,
        HR Team
        AI Resume Screener
        """
        
        return self.send_email(to_email, subject, body)

# Create a singleton instance
email_service = EmailService()

# Convenience functions
def send_email(to_email: str, subject: str, body: str, html: bool = False):
    return email_service.send_email(to_email, subject, body, html)

def send_bulk_emails(to_emails: List[str], subject: str, body: str):
    return email_service.send_bulk_emails(to_emails, subject, body)

def send_interview_invitation(to_email: str, candidate_name: str, date: str, time: str, interview_type: str):
    return email_service.send_interview_invitation(to_email, candidate_name, date, time, interview_type)

def send_selection_email(to_email: str, candidate_name: str):
    return email_service.send_selection_email(to_email, candidate_name)

def send_rejection_email(to_email: str, candidate_name: str):
    return email_service.send_rejection_email(to_email, candidate_name)