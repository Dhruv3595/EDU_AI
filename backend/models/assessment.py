"""
Assessment Models - SQLAlchemy ORM
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    grade_levels = Column(JSON, default=list)  # Applicable grades
    topics = Column(JSON, default=list)  # List of topics
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    questions = relationship("Question", back_populates="subject")
    assessments = relationship("Assessment", back_populates="subject")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    topic = Column(String(255), nullable=False)
    subtopic = Column(String(255))
    difficulty = Column(Integer, default=1)  # 1-5 scale
    question_type = Column(String(50), default="mcq")  # mcq, true_false, fill_blank
    question_text = Column(Text, nullable=False)
    question_text_translations = Column(JSON, default=dict)  # Multi-language support
    options = Column(JSON, nullable=False)  # List of options
    options_translations = Column(JSON, default=dict)
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text)
    explanation_translations = Column(JSON, default=dict)
    hint = Column(Text)
    time_limit_seconds = Column(Integer, default=60)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    subject = relationship("Subject", back_populates="questions")
    responses = relationship("QuestionResponse", back_populates="question")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(String(255))
    total_questions = Column(Integer, default=0)
    answered_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    score = Column(Float, default=0.0)  # Percentage
    time_taken_seconds = Column(Integer, default=0)
    status = Column(String(50), default="in_progress")  # in_progress, completed, abandoned
    gap_analysis = Column(JSON, default=dict)  # AI-generated gap analysis
    recommendations = Column(JSON, default=list)  # Study recommendations
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="assessments")
    subject = relationship("Subject", back_populates="assessments")
    responses = relationship("QuestionResponse", back_populates="assessment")

class QuestionResponse(Base):
    __tablename__ = "question_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_answer = Column(String(255))
    is_correct = Column(Boolean)
    time_taken_seconds = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assessment = relationship("Assessment", back_populates="responses")
    question = relationship("Question", back_populates="responses")
