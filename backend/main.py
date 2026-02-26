from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import json
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio

from database import SessionLocal, engine
from models import Base, User, Candidate
from auth import verify_password, get_password_hash, create_access_token, verify_token
from extract import extract_text
from screener import screen_resume
from services.semantic_search import SemanticSearch
from utils.email_service import send_email
from utils.calendar_service import schedule_calendar_event

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Resume Screener API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create upload directory
UPLOAD_DIR = "resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize semantic search
semantic_search = SemanticSearch()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Default job description
DEFAULT_JOB_DESCRIPTION = """
We are looking for a Python Developer with:
- Strong Python programming skills
- Experience with FastAPI or similar frameworks
- Machine learning knowledge (scikit-learn, tensorflow, or pytorch)
- SQL and database experience
- 2+ years of relevant experience
- Good communication skills
- Bachelor's degree in Computer Science or related field
"""

@app.get("/")
def root():
    return {"message": "AI Resume Screener API", "status": "running"}

@app.post("/register")
def register_form(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == email) | (User.username == username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password)
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully", "user_id": user.id}

@app.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # Find user
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token({"sub": user.username, "id": user.id})
    
    return {"access_token": token, "token_type": "bearer"}
@app.get("/test-token")
def test_token(token_data: dict = Depends(verify_token)):
    """Test endpoint to verify token is working"""
    return {
        "message": "Token is valid!",
        "user_data": token_data
    }
    
@app.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form(DEFAULT_JOB_DESCRIPTION),
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract text
    resume_text = extract_text(file_path)
    
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from file")
    
    # Create candidate entry
    candidate = Candidate(
        name="Processing...",
        email="Processing...",
        resume_text=resume_text[:1000],
        filename=file.filename,
        skills_score=0,
        experience_score=0,
        education_score=0,
        overall_score=0,
        skills="[]",
        experience_years=0,
        recommendation="PROCESSING",
        reason="Analysis in progress...",
        uploaded_by=token_data.get("id")
    )
    
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # Process in background
    asyncio.create_task(process_resume_background(candidate.id, resume_text, job_description, db))
    
    return {
        "id": candidate.id,
        "name": "Processing...",
        "email": "Processing...",
        "skills": [],
        "experience_years": 0,
        "skills_score": 0,
        "experience_score": 0,
        "education_score": 0,
        "overall_score": 0,
        "recommendation": "PROCESSING",
        "reason": "Your resume is being analyzed. Please check back in a minute."
    }

@app.post("/bulk-upload")
async def bulk_upload(
    files: List[UploadFile] = File(...),
    job_description: str = Form(DEFAULT_JOB_DESCRIPTION),
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    results = []
    
    for file in files:
        try:
            # Save file
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Extract text
            resume_text = extract_text(file_path)
            
            if resume_text:
                # Create candidate entry
                candidate = Candidate(
                    name="Processing...",
                    email="Processing...",
                    resume_text=resume_text[:1000],
                    filename=file.filename,
                    skills_score=0,
                    experience_score=0,
                    education_score=0,
                    overall_score=0,
                    skills="[]",
                    experience_years=0,
                    recommendation="PROCESSING",
                    reason="Analysis in progress...",
                    uploaded_by=token_data.get("id")
                )
                
                db.add(candidate)
                db.commit()
                db.refresh(candidate)
                
                # Process in background
                asyncio.create_task(process_resume_background(candidate.id, resume_text, job_description, db))
                
                results.append({
                    "filename": file.filename,
                    "status": "queued",
                    "candidate_id": candidate.id
                })
            else:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": "Could not extract text"
                })
                
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "total": len(files),
        "queued": len([r for r in results if r["status"] == "queued"]),
        "failed": len([r for r in results if r["status"] == "failed"]),
        "results": results
    }

async def process_resume_background(candidate_id: int, resume_text: str, job_description: str, db: Session):
    """Process resume in background"""
    try:
        # Screen resume
        result = screen_resume(resume_text, job_description)
        
        # Update database
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if candidate:
            candidate.name = result.get("name", "Unknown")
            candidate.email = result.get("email", "")
            candidate.phone = result.get("phone", "")
            candidate.skills_score = result.get("skills_score", 0)
            candidate.experience_score = result.get("experience_score", 0)
            candidate.education_score = result.get("education_score", 0)
            candidate.overall_score = result.get("overall_score", 0)
            candidate.skills = json.dumps(result.get("skills", []))
            candidate.experience_years = result.get("experience_years", 0)
            candidate.recommendation = result.get("recommendation", "REJECT")
            candidate.reason = result.get("reason", "")
            db.commit()
    except Exception as e:
        print(f"Error processing candidate {candidate_id}: {e}")

@app.get("/candidates")
def get_candidates(
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    candidates = db.query(Candidate).order_by(Candidate.overall_score.desc()).all()
    
    result = []
    for c in candidates:
        result.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "skills": json.loads(c.skills) if c.skills else [],
            "experience_years": c.experience_years,
            "skills_score": c.skills_score,
            "experience_score": c.experience_score,
            "education_score": c.education_score,
            "overall_score": c.overall_score,
            "recommendation": c.recommendation,
            "reason": c.reason,
            "filename": c.filename,
            "uploaded_at": c.created_at.isoformat() if c.created_at else None,
            "tags": []  # Add tags from database
        })
    
    # Update semantic search index
    semantic_search.prepare_candidates(result)
    
    return result

@app.get("/candidates/{candidate_id}")
def get_candidate(
    candidate_id: int,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Get full resume text
    file_path = os.path.join(UPLOAD_DIR, candidate.filename)
    full_resume = ""
    if os.path.exists(file_path):
        full_resume = extract_text(file_path)
    
    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "skills": json.loads(candidate.skills) if candidate.skills else [],
        "experience_years": candidate.experience_years,
        "skills_score": candidate.skills_score,
        "experience_score": candidate.experience_score,
        "education_score": candidate.education_score,
        "overall_score": candidate.overall_score,
        "recommendation": candidate.recommendation,
        "reason": candidate.reason,
        "filename": candidate.filename,
        "resume_text": full_resume,
        "uploaded_at": candidate.created_at.isoformat() if candidate.created_at else None,
        "tags": []  # Add tags from database
    }

@app.post("/semantic-search")
def semantic_search_endpoint(
    query: str,
    search_type: str = "hybrid",
    token_data: dict = Depends(verify_token)
):
    """Search candidates using semantic search"""
    if search_type == "keyword":
        results = semantic_search.keyword_search(query)
    elif search_type == "semantic":
        results = semantic_search.semantic_search(query)
    else:
        results = semantic_search.hybrid_search(query)
    
    return results

@app.post("/add-tags")
def add_tags(
    candidate_ids: List[int],
    tag: str,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Add tags to candidates"""
    # Implement tag storage in database
    return {"message": f"Added tag '{tag}' to {len(candidate_ids)} candidates"}

@app.post("/schedule-interview")
def schedule_interview(
    candidate_ids: List[int],
    date: str,
    time: str,
    type: str,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Schedule interviews for candidates"""
    # Get candidate emails
    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    emails = [c.email for c in candidates if c.email]
    
    # Schedule calendar events
    for email in emails:
        # Implement calendar scheduling
        pass
    
    return {
        "message": f"Scheduled interviews for {len(candidates)} candidates",
        "date": date,
        "time": time,
        "type": type
    }

@app.post("/send-emails")
def send_emails(
    candidate_ids: List[int],
    subject: str,
    body: str,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Send emails to candidates"""
    # Get candidate emails
    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    emails = [c.email for c in candidates if c.email]
    
    # Send emails
    for email in emails:
        # Implement email sending
        pass
    
    return {
        "message": f"Sent emails to {len(emails)} candidates",
        "subject": subject
    }