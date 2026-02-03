"""
Career Guidance Models - SQLAlchemy ORM
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base

class CareerPath(Base):
    __tablename__ = "career_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    title_translations = Column(JSON, default=dict)  # Multi-language titles
    description = Column(Text)
    description_translations = Column(JSON, default=dict)
    industry = Column(String(100))
    category = Column(String(100))  # stem, arts, commerce, etc.
    required_skills = Column(JSON, default=list)  # List of skill IDs
    recommended_subjects = Column(JSON, default=list)
    education_requirements = Column(JSON, default=list)
    avg_salary_range = Column(JSON, default=dict)  # {min: 0, max: 0, currency: "INR"}
    job_outlook = Column(Text)
    growth_prospects = Column(Text)
    related_careers = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    roadmaps = relationship("CareerRoadmap", back_populates="career")

class CareerRoadmap(Base):
    __tablename__ = "career_roadmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    career_id = Column(Integer, ForeignKey("career_paths.id"))
    title = Column(String(255))
    description = Column(Text)
    stage = Column(String(50))  # entry, mid, senior
    order_index = Column(Integer, default=0)
    milestones = Column(JSON, default=list)  # List of milestone objects
    time_estimate = Column(String(100))  # e.g., "2-3 years"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    career = relationship("CareerPath", back_populates="roadmaps")

class AIConversation(Base):
    __tablename__ = "ai_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String(255), index=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    message_language = Column(String(50), default="en")
    detected_intent = Column(String(100))  # AI-detected user intent
    context_data = Column(JSON, default=dict)  # Additional context
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="ai_conversations")

class Mentor(Base):
    __tablename__ = "mentors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    expertise = Column(JSON, default=list)  # Areas of expertise
    industry = Column(String(100))
    years_experience = Column(Integer)
    bio = Column(Text)
    languages = Column(JSON, default=list)  # Languages spoken
    availability = Column(JSON, default=dict)  # Schedule
    hourly_rate = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    total_sessions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
