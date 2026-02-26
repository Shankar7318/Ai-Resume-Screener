from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Association table for candidate-tag many-to-many relationship
candidate_tags = Table(
    'candidate_tags',
    Base.metadata,
    Column('candidate_id', Integer, ForeignKey('candidates.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String(256))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    candidates = relationship("Candidate", back_populates="uploader")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    color = Column(String, default="blue")
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    candidates = relationship("Candidate", secondary=candidate_tags, back_populates="tags")

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    resume_text = Column(Text)
    filename = Column(String)
    
    # Scores
    skills_score = Column(Float)
    experience_score = Column(Float)
    education_score = Column(Float)
    overall_score = Column(Float)
    
    # Extracted info
    skills = Column(Text)  # JSON string
    experience_years = Column(Float)
    recommendation = Column(String)
    reason = Column(Text)
    
    # Metadata
    uploaded_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    uploader = relationship("User", back_populates="candidates")
    tags = relationship("Tag", secondary=candidate_tags, back_populates="candidates")
    interviews = relationship("Interview", back_populates="candidate")
    emails = relationship("Email", back_populates="candidate")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'))
    scheduled_date = Column(DateTime)
    duration = Column(Integer, default=60)  # minutes
    type = Column(String)  # video, phone, inperson
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    meeting_link = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    candidate = relationship("Candidate", back_populates="interviews")

class Email(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'))
    subject = Column(String)
    body = Column(Text)
    type = Column(String)  # interview, selection, rejection, custom
    status = Column(String, default="sent")  # sent, failed, pending
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_by = Column(Integer, ForeignKey('users.id'))
    
    # Relationships
    candidate = relationship("Candidate", back_populates="emails")