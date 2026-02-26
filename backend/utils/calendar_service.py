from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CalendarService:
    def __init__(self):
        self.calendar_provider = os.getenv("CALENDAR_PROVIDER", "google")
        self.timezone = os.getenv("TIMEZONE", "UTC")
    
    def generate_calendar_link(self, title: str, date: str, time: str, 
                               duration: int = 60, attendees: List[str] = None) -> Optional[str]:
        """Generate calendar invitation link"""
        try:
            start_datetime = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
            end_datetime = start_datetime + timedelta(minutes=duration)
            
            if self.calendar_provider == "google":
                # Google Calendar link
                base_url = "https://calendar.google.com/calendar/render"
                params = {
                    "action": "TEMPLATE",
                    "text": title,
                    "dates": f"{start_datetime.strftime('%Y%m%dT%H%M%S')}/{end_datetime.strftime('%Y%m%dT%H%M%S')}",
                    "details": f"Interview scheduled via AI Resume Screener",
                    "location": "Video Call"
                }
                
                if attendees:
                    params["add"] = ",".join(attendees)
                
                query = "&".join([f"{k}={v}" for k, v in params.items()])
                return f"{base_url}?{query}"
                
            elif self.calendar_provider == "outlook":
                # Outlook Calendar link
                base_url = "https://outlook.live.com/calendar/0/deeplink/compose"
                params = {
                    "path": "/calendar/action/compose",
                    "rru": "addevent",
                    "startdt": start_datetime.isoformat(),
                    "enddt": end_datetime.isoformat(),
                    "subject": title,
                    "body": "Interview scheduled via AI Resume Screener",
                    "location": "Video Call"
                }
                
                query = "&".join([f"{k}={v}" for k, v in params.items()])
                return f"{base_url}?{query}"
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating calendar link: {e}")
            return None
    
    def create_ics_file(self, title: str, date: str, time: str, 
                        duration: int = 60, attendees: List[str] = None,
                        description: str = "") -> Optional[str]:
        """Create .ics calendar file"""
        try:
            start_datetime = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
            end_datetime = start_datetime + timedelta(minutes=duration)
            
            ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Resume Screener//EN
BEGIN:VEVENT
UID:{datetime.now().timestamp()}@airesumescreener.com
DTSTAMP:{datetime.now().strftime('%Y%m%dT%H%M%S')}Z
DTSTART:{start_datetime.strftime('%Y%m%dT%H%M%S')}Z
DTEND:{end_datetime.strftime('%Y%m%dT%H%M%S')}Z
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:Video Call
"""
            
            if attendees:
                for attendee in attendees:
                    ics_content += f"ATTENDEE:mailto:{attendee}\n"
            
            ics_content += """END:VEVENT
END:VCALENDAR"""
            
            # Create directory if it doesn't exist
            os.makedirs("calendar_invites", exist_ok=True)
            
            # Save to file
            filename = f"interview_{date}_{time.replace(':', '')}.ics"
            filepath = os.path.join("calendar_invites", filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(ics_content)
            
            logger.info(f"ICS file created: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error creating ICS file: {e}")
            return None
    
    def schedule_interviews(self, candidates: List[Dict[str, Any]], 
                           date: str, time: str, interview_type: str) -> List[Dict[str, Any]]:
        """Schedule interviews for multiple candidates"""
        results = []
        
        for candidate in candidates:
            try:
                # Generate calendar link
                calendar_link = self.generate_calendar_link(
                    title=f"Interview with {candidate.get('name', 'Candidate')}",
                    date=date,
                    time=time,
                    attendees=[candidate.get('email')] if candidate.get('email') else None
                )
                
                # Create .ics file
                ics_file = self.create_ics_file(
                    title=f"Interview with {candidate.get('name', 'Candidate')}",
                    date=date,
                    time=time,
                    attendees=[candidate.get('email')] if candidate.get('email') else None,
                    description=f"Interview type: {interview_type}\nCandidate: {candidate.get('name', 'Unknown')}\nEmail: {candidate.get('email', 'Unknown')}"
                )
                
                results.append({
                    'candidate_id': candidate.get('id'),
                    'name': candidate.get('name'),
                    'email': candidate.get('email'),
                    'calendar_link': calendar_link,
                    'ics_file': ics_file,
                    'status': 'scheduled'
                })
                
                logger.info(f"Scheduled interview for {candidate.get('name')}")
                
            except Exception as e:
                logger.error(f"Error scheduling interview for candidate {candidate.get('id')}: {e}")
                results.append({
                    'candidate_id': candidate.get('id'),
                    'name': candidate.get('name'),
                    'email': candidate.get('email'),
                    'status': 'failed',
                    'error': str(e)
                })
        
        return results

# Create a singleton instance
calendar_service = CalendarService()

# Convenience functions
def generate_calendar_link(title: str, date: str, time: str, duration: int = 60, attendees: List[str] = None):
    return calendar_service.generate_calendar_link(title, date, time, duration, attendees)

def create_ics_file(title: str, date: str, time: str, duration: int = 60, attendees: List[str] = None, description: str = ""):
    return calendar_service.create_ics_file(title, date, time, duration, attendees, description)

def schedule_calendar_event(candidates: List[Dict[str, Any]], date: str, time: str, interview_type: str):
    return calendar_service.schedule_interviews(candidates, date, time, interview_type)