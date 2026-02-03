"""
Admin Router - Educator Dashboard
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import List, Optional

from database.connection import get_db
from models.user import User, StudentProfile, UserRole
from models.assessment import Subject, Question, Assessment
from models.study_plan import LearningResource
from utils.security import get_current_user
from utils.logger import logger

router = APIRouter()

# Pydantic Models
class QuestionCreate(BaseModel):
    subject_id: int
    topic: str
    subtopic: Optional[str] = None
    difficulty: int = 1
    question_type: str = "mcq"
    question_text: str
    question_text_translations: Optional[dict] = {}
    options: List[str]
    options_translations: Optional[dict] = {}
    correct_answer: str
    explanation: Optional[str] = None
    explanation_translations: Optional[dict] = {}
    hint: Optional[str] = None
    time_limit_seconds: int = 60

class ResourceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    resource_type: str
    url: str
    subject_id: Optional[int] = None
    topic: Optional[str] = None
    difficulty: int = 1
    language: str = "en"
    duration_minutes: Optional[int] = None
    tags: Optional[List[str]] = []

async def verify_admin(current_user: dict, db: AsyncSession):
    """Verify user is admin"""
    user_id = int(current_user["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

@router.get("/dashboard")
async def admin_dashboard(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard statistics"""
    await verify_admin(current_user, db)
    
    # User statistics
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar()
    
    result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.STUDENT)
    )
    total_students = result.scalar()
    
    # Assessment statistics
    result = await db.execute(select(func.count(Assessment.id)))
    total_assessments = result.scalar()
    
    result = await db.execute(select(func.avg(Assessment.score)))
    avg_score = result.scalar() or 0
    
    # Recent users
    result = await db.execute(
        select(User).order_by(desc(User.created_at)).limit(10)
    )
    recent_users = result.scalars().all()
    
    return {
        "statistics": {
            "total_users": total_users,
            "total_students": total_students,
            "total_assessments": total_assessments,
            "average_score": round(avg_score, 2)
        },
        "recent_users": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role.value,
                "created_at": u.created_at
            }
            for u in recent_users
        ]
    }

@router.get("/students")
async def get_all_students(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all students with details"""
    await verify_admin(current_user, db)
    
    result = await db.execute(
        select(User, StudentProfile)
        .join(StudentProfile)
        .where(User.role == UserRole.STUDENT)
        .offset(skip)
        .limit(limit)
    )
    
    students = []
    for row in result.all():
        user, profile = row
        students.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "grade": profile.grade,
            "preferred_language": profile.preferred_language,
            "created_at": user.created_at,
            "is_active": user.is_active
        })
    
    return {"students": students, "count": len(students)}

@router.post("/questions")
async def create_question(
    question_data: QuestionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new question"""
    await verify_admin(current_user, db)
    
    question = Question(
        subject_id=question_data.subject_id,
        topic=question_data.topic,
        subtopic=question_data.subtopic,
        difficulty=question_data.difficulty,
        question_type=question_data.question_type,
        question_text=question_data.question_text,
        question_text_translations=question_data.question_text_translations,
        options=question_data.options,
        options_translations=question_data.options_translations,
        correct_answer=question_data.correct_answer,
        explanation=question_data.explanation,
        explanation_translations=question_data.explanation_translations,
        hint=question_data.hint,
        time_limit_seconds=question_data.time_limit_seconds
    )
    
    db.add(question)
    await db.commit()
    
    logger.info(f"Question created: {question.id} by admin {current_user['sub']}")
    
    return {
        "message": "Question created successfully",
        "question_id": question.id
    }

@router.post("/resources")
async def create_resource(
    resource_data: ResourceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new learning resource"""
    await verify_admin(current_user, db)
    
    resource = LearningResource(
        title=resource_data.title,
        description=resource_data.description,
        resource_type=resource_data.resource_type,
        url=resource_data.url,
        subject_id=resource_data.subject_id,
        topic=resource_data.topic,
        difficulty=resource_data.difficulty,
        language=resource_data.language,
        duration_minutes=resource_data.duration_minutes,
        tags=resource_data.tags
    )
    
    db.add(resource)
    await db.commit()
    
    logger.info(f"Resource created: {resource.id} by admin {current_user['sub']}")
    
    return {
        "message": "Resource created successfully",
        "resource_id": resource.id
    }

@router.get("/analytics")
async def get_analytics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get platform analytics"""
    await verify_admin(current_user, db)
    
    # Daily active users (simplified)
    result = await db.execute(
        select(func.count(func.distinct(Assessment.user_id)))
        .where(Assessment.created_at >= func.now() - func.interval('1 day'))
    )
    daily_active = result.scalar()
    
    # Subject-wise performance
    result = await db.execute(
        select(Subject.name, func.avg(Assessment.score))
        .join(Assessment)
        .group_by(Subject.id)
    )
    subject_performance = [
        {"subject": row[0], "avg_score": round(row[1] or 0, 2)}
        for row in result.all()
    ]
    
    return {
        "daily_active_users": daily_active,
        "subject_performance": subject_performance,
        "platform_health": "operational"
    }
