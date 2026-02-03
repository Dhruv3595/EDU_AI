"""
Study Plan Router - Personalized Study Plan Generator
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta

from database.connection import get_db
from models.study_plan import StudyPlan, StudyTask, LearningResource, TaskStatus
from models.assessment import Assessment
from utils.security import get_current_user
from utils.logger import logger
from services.ai_generator import generate_ai_study_plan

router = APIRouter()

@router.get("/")
async def get_study_plans(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all study plans for current user"""
    user_id = int(current_user["sub"])
    
    result = await db.execute(
        select(StudyPlan).where(
            StudyPlan.user_id == user_id
        ).order_by(desc(StudyPlan.created_at))
    )
    plans = result.scalars().all()
    
    return {
        "plans": [
            {
                "id": p.id,
                "title": p.title,
                "subject_id": p.subject_id,
                "start_date": p.start_date,
                "end_date": p.end_date,
                "status": p.status,
                "progress": (p.completed_tasks / p.total_tasks * 100) if p.total_tasks > 0 else 0
            }
            for p in plans
        ]
    }

# Pydantic Models
class StudyPlanGenerate(BaseModel):
    subject_id: int
    topics: List[str]
    start_date: date
    end_date: date
    daily_hours: float = 2.0
    focus_areas: Optional[List[str]] = None

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

@router.post("/generate")
async def generate_study_plan(
    plan_data: StudyPlanGenerate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate AI-powered personalized study plan"""
    try:
        user_id = int(current_user["sub"])
        logger.info(f"Generating study plan for user {user_id}")
        
        # Get recent assessment for gap analysis
        result = await db.execute(
            select(Assessment).where(
                (Assessment.user_id == user_id) &
                (Assessment.subject_id == plan_data.subject_id)
            ).order_by(desc(Assessment.started_at))
        )
        recent_assessment = result.scalars().first()
        
        # Generate plan using AI algorithm
        plan_structure = generate_ai_study_plan(
            subject=f"Subject ID {plan_data.subject_id}", # Ideally get name, but ID used for now
            topics=plan_data.topics,
            start_date=plan_data.start_date,
            end_date=plan_data.end_date,
            daily_hours=plan_data.daily_hours,
            focus_areas=plan_data.focus_areas
        )
        
        # Convert date objects to strings for JSON serialization
        plan_structure_json = {
            **plan_structure,
            "tasks": [
                {
                    **task,
                    "scheduled_date": task["scheduled_date"].isoformat() if isinstance(task["scheduled_date"], date) else task["scheduled_date"]
                }
                for task in plan_structure["tasks"]
            ]
        }
        
        # Create study plan
        study_plan = StudyPlan(
            user_id=user_id,
            title=f"Study Plan: {', '.join(plan_data.topics[:3])}{'...' if len(plan_data.topics) > 3 else ''}",
            subject_id=plan_data.subject_id,
            start_date=plan_data.start_date,
            end_date=plan_data.end_date,
            total_tasks=len(plan_structure["tasks"]),
            plan_data=plan_structure_json,
            ai_generated=True
        )
        
        db.add(study_plan)
        await db.flush()
        
        # Create tasks 
        for task_data in plan_structure["tasks"]:
            # Parse date string if needed
            sched_date = task_data["scheduled_date"]
            if isinstance(sched_date, str):
                try:
                    sched_date = date.fromisoformat(sched_date)
                except ValueError:
                    # Fallback to start date if parse fails
                    sched_date = plan_data.start_date

            task = StudyTask(
                plan_id=study_plan.id,
                topic=task_data["topic"],
                subtopic=task_data.get("subtopic"),
                description=task_data.get("description"),
                task_type=task_data.get("task_type", "study"),
                scheduled_date=sched_date,
                duration_minutes=task_data["duration_minutes"],
                priority=task_data.get("priority", 2),
                resources=task_data.get("resources", [])
            )
            db.add(task)
        
        await db.commit()
        
        logger.info(f"Study plan generated: {study_plan.id} for user {user_id}")
        
        return {
            "plan_id": study_plan.id,
            "title": study_plan.title,
            "total_tasks": study_plan.total_tasks,
            "start_date": study_plan.start_date,
            "end_date": study_plan.end_date,
            "status": study_plan.status
        }
    
    except Exception as e:
        logger.error(f"ERROR creating study plan: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create study plan: {str(e)}")

def generate_adaptive_plan(topics, start_date, end_date, daily_hours, gap_analysis=None, focus_areas=None):
    """AI algorithm to generate adaptive study plan"""
    tasks = []
    current_date = start_date
    
    # Calculate total days
    total_days = (end_date - start_date).days + 1
    
    # Prioritize topics based on gaps
    topic_priority = {}
    for topic in topics:
        priority = 2  # Default medium priority
        
        # Increase priority for weak areas
        if gap_analysis and "gaps" in gap_analysis:
            for gap in gap_analysis["gaps"]:
                if gap["topic"] == topic:
                    priority = 3 if gap["severity"] == "high" else 2
        
        # Increase priority for focus areas
        if focus_areas and topic in focus_areas:
            priority = min(priority + 1, 3)
        
        topic_priority[topic] = priority
    
    # Sort topics by priority
    sorted_topics = sorted(topics, key=lambda t: topic_priority[t], reverse=True)
    
    # Distribute topics across days
    topics_per_day = max(1, len(sorted_topics) // total_days)
    daily_minutes = int(daily_hours * 60)
    
    topic_index = 0
    while current_date <= end_date and topic_index < len(sorted_topics):
        day_topics = sorted_topics[topic_index:topic_index + topics_per_day]
        minutes_per_topic = daily_minutes // len(day_topics) if day_topics else daily_minutes
        
        for topic in day_topics:
            # Study task
            tasks.append({
                "topic": topic,
                "subtopic": "Concept Review",
                "description": f"Study and understand {topic} concepts",
                "task_type": "study",
                "scheduled_date": current_date,
                "duration_minutes": minutes_per_topic // 2,
                "priority": topic_priority[topic],
                "resources": []
            })
            
            # Practice task
            tasks.append({
                "topic": topic,
                "subtopic": "Practice Problems",
                "description": f"Solve practice problems on {topic}",
                "task_type": "practice",
                "scheduled_date": current_date,
                "duration_minutes": minutes_per_topic // 2,
                "priority": topic_priority[topic],
                "resources": []
            })
        
        topic_index += topics_per_day
        current_date += timedelta(days=1)
    
    # Add review days
    review_days = [end_date - timedelta(days=i) for i in range(min(3, total_days))]
    for review_date in review_days:
        tasks.append({
            "topic": "Review",
            "subtopic": "Comprehensive Review",
            "description": "Review all topics and practice mixed problems",
            "task_type": "review",
            "scheduled_date": review_date,
            "duration_minutes": daily_minutes,
            "priority": 3,
            "resources": []
        })
    
    return {
        "topics": topics,
        "daily_hours": daily_hours,
        "tasks": tasks
    }

@router.get("/current")
async def get_current_plan(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current active study plan"""
    user_id = int(current_user["sub"])
    
    result = await db.execute(
        select(StudyPlan).where(
            (StudyPlan.user_id == user_id) &
            (StudyPlan.status == "active")
        ).order_by(desc(StudyPlan.created_at))
    )
    plan = result.scalars().first()
    
    if not plan:
        return {"message": "No active study plan found"}
    
    # Get tasks
    result = await db.execute(
        select(StudyTask).where(StudyTask.plan_id == plan.id)
    )
    tasks = result.scalars().all()
    
    return {
        "plan_id": plan.id,
        "title": plan.title,
        "description": plan.description,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "progress": (plan.completed_tasks / plan.total_tasks * 100) if plan.total_tasks > 0 else 0,
        "total_tasks": plan.total_tasks,
        "completed_tasks": plan.completed_tasks,
        "status": plan.status,
        "tasks": [
            {
                "id": task.id,
                "topic": task.topic,
                "subtopic": task.subtopic,
                "description": task.description,
                "task_type": task.task_type,
                "scheduled_date": task.scheduled_date,
                "duration_minutes": task.duration_minutes,
                "priority": task.priority,
                "status": task.status,
                "completed_at": task.completed_at
            }
            for task in tasks
        ]
    }

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: int,
    update_data: TaskUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update task status"""
    user_id = int(current_user["sub"])
    
    # Get task and verify ownership
    result = await db.execute(
        select(StudyTask, StudyPlan).join(StudyPlan).where(
            (StudyTask.id == task_id) &
            (StudyPlan.user_id == user_id)
        )
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task, plan = row
    
    # Update status
    if update_data.status:
        old_status = task.status
        task.status = update_data.status
        
        if update_data.status == "completed" and old_status != "completed":
            task.completed_at = datetime.utcnow()
            plan.completed_tasks += 1
        elif old_status == "completed" and update_data.status != "completed":
            plan.completed_tasks -= 1
            task.completed_at = None
    
    if update_data.notes:
        task.notes = update_data.notes
    
    await db.commit()
    
    return {"message": "Task updated successfully", "task_id": task_id}

@router.get("/tasks/today")
async def get_today_tasks(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get today's study tasks"""
    user_id = int(current_user["sub"])
    today = date.today()
    
    result = await db.execute(
        select(StudyTask, StudyPlan).join(StudyPlan).where(
            (StudyPlan.user_id == user_id) &
            (StudyTask.scheduled_date <= today) &
            (StudyTask.status != "completed") &
            (StudyPlan.status == "active")
        ).order_by(StudyTask.scheduled_date)
    )
    
    tasks = []
    for row in result.all():
        task, plan = row
        tasks.append({
            "id": task.id,
            "topic": task.topic,
            "subtopic": task.subtopic,
            "description": task.description,
            "task_type": task.task_type,
            "duration_minutes": task.duration_minutes,
            "priority": task.priority,
            "status": task.status
        })

    # If no tasks for today/overdue, get next upcoming tasks
    if not tasks:
        result = await db.execute(
            select(StudyTask, StudyPlan).join(StudyPlan).where(
                (StudyPlan.user_id == user_id) &
                (StudyTask.scheduled_date > today) &
                (StudyPlan.status == "active")
            ).order_by(StudyTask.scheduled_date).limit(3)
        )
        for row in result.all():
            task, plan = row
            tasks.append({
                "id": task.id,
                "topic": f"{task.topic} (Upcoming)",
                "subtopic": task.subtopic,
                "description": task.description,
                "task_type": task.task_type,
                "duration_minutes": task.duration_minutes,
                "priority": task.priority,
                "status": task.status,
                "is_upcoming": True
            })
    
    return {
        "date": today.isoformat(),
        "total_tasks": len(tasks),
        "completed_tasks": sum(1 for t in tasks if t["status"] == "completed"),
        "tasks": tasks
    }
