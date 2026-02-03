"""
User Models - SQLAlchemy ORM
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    assessments = relationship("Assessment", back_populates="user")
    study_plans = relationship("StudyPlan", back_populates="user")
    ai_conversations = relationship("AIConversation", back_populates="user")
    skills = relationship("StudentSkill", back_populates="user")

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    grade = Column(String(50))
    preferred_language = Column(String(50), default="en")
    learning_style = Column(String(50))  # visual, auditory, kinesthetic, reading
    study_hours_per_day = Column(Integer, default=2)
    academic_goals = Column(Text)
    interests = Column(JSON, default=list)  # List of interest areas
    strengths = Column(JSON, default=list)  # Identified strengths
    weaknesses = Column(JSON, default=list)  # Identified weaknesses
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="student_profile")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    category = Column(String(100))  # technical, soft, academic
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student_skills = relationship("StudentSkill", back_populates="skill")

class StudentSkill(Base):
    __tablename__ = "student_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    proficiency_level = Column(Integer, default=0)  # 0-100
    assessed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="student_skills")
