"""
Learning Resources Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import Optional, List

from database.connection import get_db
from models.study_plan import LearningResource
from models.assessment import Subject
from utils.security import get_current_user

router = APIRouter()

@router.get("/")
async def get_resources(
    subject_id: Optional[int] = None,
    topic: Optional[str] = None,
    resource_type: Optional[str] = None,
    difficulty: Optional[int] = None,
    language: str = "en",
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get learning resources with filters"""
    query = select(LearningResource)
    
    if subject_id:
        query = query.where(LearningResource.subject_id == subject_id)
    if topic:
        query = query.where(LearningResource.topic.ilike(f"%{topic}%"))
    if resource_type:
        query = query.where(LearningResource.resource_type == resource_type)
    if difficulty:
        query = query.where(LearningResource.difficulty == difficulty)
    if language:
        query = query.where(LearningResource.language == language)
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    result = await db.execute(
        query.order_by(desc(LearningResource.rating))
        .offset(offset)
        .limit(limit)
    )
    resources = result.scalars().all()
    
    return {
        "resources": [
            {
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "type": r.resource_type,
                "url": r.url,
                "topic": r.topic,
                "difficulty": r.difficulty,
                "duration_minutes": r.duration_minutes,
                "tags": r.tags,
                "rating": r.rating,
                "view_count": r.view_count
            }
            for r in resources
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/recommended")
async def get_recommended_resources(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-recommended resources based on user profile"""
    user_id = int(current_user["sub"])
    
    # In production, use ML recommendation engine
    # For now, return highly-rated resources
    
    result = await db.execute(
        select(LearningResource)
        .where(LearningResource.rating >= 4.0)
        .order_by(desc(LearningResource.rating))
        .limit(10)
    )
    resources = result.scalars().all()
    
    return {
        "recommended": [
            {
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "type": r.resource_type,
                "url": r.url,
                "topic": r.topic,
                "difficulty": r.difficulty,
                "rating": r.rating,
                "reason": "Highly rated by students"
            }
            for r in resources
        ]
    }

@router.get("/{resource_id}")
async def get_resource_detail(
    resource_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed resource information"""
    result = await db.execute(
        select(LearningResource).where(LearningResource.id == resource_id)
    )
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Increment view count
    resource.view_count += 1
    await db.commit()
    
    return {
        "id": resource.id,
        "title": resource.title,
        "description": resource.description,
        "type": resource.resource_type,
        "url": resource.url,
        "topic": resource.topic,
        "difficulty": resource.difficulty,
        "language": resource.language,
        "duration_minutes": resource.duration_minutes,
        "tags": resource.tags,
        "rating": resource.rating,
        "view_count": resource.view_count
    }
