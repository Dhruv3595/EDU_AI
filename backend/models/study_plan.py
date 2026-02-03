"""
Study Plan Models - SQLAlchemy ORM
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base
import enum

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"

class StudyPlan(Base):
    __tablename__ = "study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)
    status = Column(String(50), default="active")  # active, completed, paused
    plan_data = Column(JSON, default=dict)  # Full plan structure
    ai_generated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="study_plans")
    tasks = relationship("StudyTask", back_populates="study_plan")

class StudyTask(Base):
    __tablename__ = "study_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id"))
    topic = Column(String(255), nullable=False)
    subtopic = Column(String(255))
    description = Column(Text)
    task_type = Column(String(50), default="study")  # study, practice, review, assessment
    scheduled_date = Column(Date)
    duration_minutes = Column(Integer, default=30)
    priority = Column(Integer, default=2)  # 1-3 (high, medium, low)
    status = Column(String(50), default="pending")
    resources = Column(JSON, default=list)  # List of resource IDs
    notes = Column(Text)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    study_plan = relationship("StudyPlan", back_populates="tasks")

class LearningResource(Base):
    __tablename__ = "learning_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    resource_type = Column(String(50))  # video, article, pdf, interactive, quiz
    url = Column(String(500))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    topic = Column(String(255))
    difficulty = Column(Integer, default=1)  # 1-5
    language = Column(String(50), default="en")
    duration_minutes = Column(Integer)
    tags = Column(JSON, default=list)
    rating = Column(Float, default=0.0)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
