"""
Student Dashboard Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from database.connection import get_db
from models.user import User, StudentProfile, StudentSkill, Skill
from models.assessment import Assessment, Subject
from models.study_plan import StudyPlan, StudyTask
from utils.security import get_current_user
from utils.logger import logger

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get student dashboard data"""
    user_id = int(current_user["sub"])
    
    # Get user profile
    result = await db.execute(
        select(User, StudentProfile).join(StudentProfile).where(User.id == user_id)
    )
    user_row = result.first()
    
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    
    user, profile = user_row
    
    # Get recent assessments
    result = await db.execute(
        select(Assessment, Subject)
        .join(Subject)
        .where(Assessment.user_id == user_id)
        .order_by(desc(Assessment.started_at))
        .limit(5)
    )
    recent_assessments = []
    for row in result.all():
        assessment, subject = row
        recent_assessments.append({
            "id": assessment.id,
            "subject": subject.name,
            "score": assessment.score,
            "status": assessment.status,
            "completed_at": assessment.completed_at
        })
    
    # Get active study plan
    result = await db.execute(
        select(StudyPlan).where(
            (StudyPlan.user_id == user_id) &
            (StudyPlan.status == "active")
        ).order_by(desc(StudyPlan.created_at))
    )
    active_plan = result.scalars().first()
    
    study_plan_data = None
    if active_plan:
        # Get smart tasks (Today + Overdue, Fallback to Upcoming)
        from datetime import date
        today = date.today()
        
        # 1. Get Today & Overdue
        result = await db.execute(
            select(StudyTask).where(
                (StudyTask.plan_id == active_plan.id) &
                (StudyTask.scheduled_date <= today) &
                (StudyTask.status != "completed")
            ).order_by(StudyTask.scheduled_date)
        )
        smart_tasks = result.scalars().all()
        
        # 2. Add upcoming if list is short
        if len(smart_tasks) < 5:
            result = await db.execute(
                select(StudyTask).where(
                    (StudyTask.plan_id == active_plan.id) &
                    (StudyTask.scheduled_date > today)
                ).order_by(StudyTask.scheduled_date).limit(5 - len(smart_tasks))
            )
            smart_tasks.extend(result.scalars().all())

        study_plan_data = {
            "id": active_plan.id,
            "title": active_plan.title,
            "progress": (active_plan.completed_tasks / active_plan.total_tasks * 100) if active_plan.total_tasks > 0 else 0,
            "total_tasks": active_plan.total_tasks,
            "completed_tasks": active_plan.completed_tasks,
            "tasks": [
                {
                    "id": task.id,
                    "topic": task.topic + (" (Upcoming)" if task.scheduled_date > today else ""),
                    "status": task.status,
                    "scheduled_date": task.scheduled_date,
                    "duration_minutes": task.duration_minutes
                }
                for task in smart_tasks[:5]
            ]
        }
    
    # Get skills
    result = await db.execute(
        select(StudentSkill, Skill)
        .join(Skill)
        .where(StudentSkill.user_id == user_id)
    )
    skills = []
    for row in result.all():
        student_skill, skill = row
        skills.append({
            "name": skill.name,
            "category": skill.category,
            "proficiency": student_skill.proficiency_level
        })
    
    # Calculate stats
    result = await db.execute(
        select(func.count(Assessment.id)).where(Assessment.user_id == user_id)
    )
    total_assessments = result.scalar() or 0
    
    result = await db.execute(
        select(func.avg(Assessment.score)).where(Assessment.user_id == user_id)
    )
    avg_score = result.scalar() or 0
    
    # Get learning streak (simplified)
    streak = 5  # Placeholder - would calculate from actual activity
    
    # Get recommendations from plan metadata if available
    recommendations = [
        "Complete your daily study tasks",
        "Review your latest assessment results",
        "Take a new assessment to track progress"
    ]
    if active_plan and active_plan.plan_data:
        metadata = active_plan.plan_data.get("metadata", {})
        tactics = metadata.get("learning_tactics", [])
        if tactics:
            recommendations = tactics[:4] # Take top 4 AI tips
    
    return {
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "grade": profile.grade,
            "preferred_language": profile.preferred_language
        },
        "stats": {
            "total_assessments": total_assessments,
            "average_score": round(avg_score, 2),
            "learning_streak": streak,
            "study_hours_this_week": 12  # Placeholder
        },
        "skills": skills,
        "recent_assessments": recent_assessments,
        "active_study_plan": study_plan_data,
        "recommendations": recommendations
    }

@router.get("/progress")
async def get_progress(
    subject_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed progress analytics"""
    user_id = int(current_user["sub"])
    
    # Base query
    query = select(Assessment).where(Assessment.user_id == user_id)
    if subject_id:
        query = query.where(Assessment.subject_id == subject_id)
    
    # FIXED: Changed from created_at to started_at
    result = await db.execute(query.order_by(Assessment.started_at))
    assessments = result.scalars().all()
    
    # Calculate progress over time
    progress_data = []
    for assessment in assessments:
        progress_data.append({
            "date": assessment.started_at.isoformat() if assessment.started_at else None,
            "score": assessment.score,
            "subject_id": assessment.subject_id
        })
    
    # Get gap analysis from latest assessment
    latest_gap_analysis = {}
    if assessments:
        latest = assessments[-1]
        latest_gap_analysis = latest.gap_analysis or {}
    
    return {
        "progress_over_time": progress_data,
        "gap_analysis": latest_gap_analysis,
        "total_assessments": len(assessments),
        "improvement_rate": calculate_improvement_rate(assessments)
    }

def calculate_improvement_rate(assessments):
    """Calculate learning improvement rate"""
    if len(assessments) < 2:
        return 0
    
    scores = [a.score for a in assessments if a.score is not None]
    if len(scores) < 2:
        return 0
    
    # Simple linear trend
    first_half = scores[:len(scores)//2]
    second_half = scores[len(scores)//2:]
    
    avg_first = sum(first_half) / len(first_half) if first_half else 0
    avg_second = sum(second_half) / len(second_half) if second_half else 0
    
    return round(avg_second - avg_first, 2)