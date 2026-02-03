"""
Career Guidance Router - Multi-language Career Support
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional
import random

from database.connection import get_db
from models.career import CareerPath, CareerRoadmap
from models.user import User, StudentProfile, StudentSkill, Skill
from utils.security import get_current_user
from utils.logger import logger

router = APIRouter()

# Supported languages with their codes
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu"
}

# Pydantic Models
class CareerMatchRequest(BaseModel):
    interests: List[str]
    skills: List[str]
    language: str = "en"

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {
        "languages": SUPPORTED_LANGUAGES
    }

@router.get("/careers")
async def get_careers(
    industry: Optional[str] = None,
    category: Optional[str] = None,
    language: str = "en",
    db: AsyncSession = Depends(get_db)
):
    """Get career paths with multi-language support"""
    query = select(CareerPath)
    
    if industry:
        query = query.where(CareerPath.industry == industry)
    if category:
        query = query.where(CareerPath.category == category)
    
    result = await db.execute(query)
    careers = result.scalars().all()
    
    career_list = []
    for career in careers:
        # Get translated content
        title = career.title
        description = career.description
        
        if language != "en" and career.title_translations:
            title = career.title_translations.get(language, career.title)
        if language != "en" and career.description_translations:
            description = career.description_translations.get(language, career.description)
        
        career_list.append({
            "id": career.id,
            "title": title,
            "description": description,
            "industry": career.industry,
            "category": career.category,
            "avg_salary_range": career.avg_salary_range,
            "required_skills": career.required_skills
        })
    
    return {
        "careers": career_list,
        "total": len(career_list),
        "language": SUPPORTED_LANGUAGES.get(language, "English")
    }

@router.get("/careers/{career_id}")
async def get_career_details(
    career_id: int,
    language: str = "en",
    db: AsyncSession = Depends(get_db)
):
    """Get detailed career information with roadmap"""
    result = await db.execute(select(CareerPath).where(CareerPath.id == career_id))
    career = result.scalar_one_or_none()
    
    if not career:
        raise HTTPException(status_code=404, detail="Career not found")
    
    # Get translated content
    title = career.title
    description = career.description
    job_outlook = career.job_outlook
    growth_prospects = career.growth_prospects
    
    if language != "en":
        if career.title_translations:
            title = career.title_translations.get(language, career.title)
        if career.description_translations:
            description = career.description_translations.get(language, career.description)
    
    # Get roadmap
    result = await db.execute(
        select(CareerRoadmap).where(CareerRoadmap.career_id == career_id)
        .order_by(CareerRoadmap.order_index)
    )
    roadmaps = result.scalars().all()
    
    return {
        "id": career.id,
        "title": title,
        "description": description,
        "industry": career.industry,
        "category": career.category,
        "avg_salary_range": career.avg_salary_range,
        "job_outlook": job_outlook,
        "growth_prospects": growth_prospects,
        "required_skills": career.required_skills,
        "recommended_subjects": career.recommended_subjects,
        "education_requirements": career.education_requirements,
        "related_careers": career.related_careers,
        "roadmap": [
            {
                "stage": roadmap.stage,
                "title": roadmap.title,
                "description": roadmap.description,
                "milestones": roadmap.milestones,
                "time_estimate": roadmap.time_estimate
            }
            for roadmap in roadmaps
        ]
    }

@router.post("/match-skills")
async def match_skills_to_careers(
    match_data: CareerMatchRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Match student skills to career paths"""
    user_id = int(current_user["sub"])
    
    # Get user's skills
    result = await db.execute(
        select(StudentSkill, Skill).join(Skill).where(StudentSkill.user_id == user_id)
    )
    user_skills = [skill.name for _, skill in result.all()]
    
    # Add provided skills
    all_skills = list(set(user_skills + match_data.skills))
    
    # Get all careers
    result = await db.execute(select(CareerPath))
    careers = result.scalars().all()
    
    # Calculate match scores
    career_matches = []
    for career in careers:
        required = set(career.required_skills or [])
        user_has = set(all_skills)
        
        if required:
            match_count = len(required & user_has)
            match_percentage = (match_count / len(required)) * 100
        else:
            match_percentage = 50  # Default if no skills specified
        
        # Boost score for interest match
        interest_boost = 0
        for interest in match_data.interests:
            if interest.lower() in career.title.lower() or interest.lower() in (career.category or "").lower():
                interest_boost += 10
        
        final_score = min(match_percentage + interest_boost, 100)
        
        # Get translated title
        title = career.title
        if match_data.language != "en" and career.title_translations:
            title = career.title_translations.get(match_data.language, career.title)
        
        career_matches.append({
            "career_id": career.id,
            "title": title,
            "industry": career.industry,
            "match_percentage": round(final_score, 1),
            "matched_skills": list(required & user_has),
            "missing_skills": list(required - user_has),
            "avg_salary_range": career.avg_salary_range
        })
    
    # Sort by match percentage
    career_matches.sort(key=lambda x: x["match_percentage"], reverse=True)
    
    return {
        "matches": career_matches[:10],  # Top 10 matches
        "user_skills": all_skills,
        "language": SUPPORTED_LANGUAGES.get(match_data.language, "English")
    }

@router.get("/industries")
async def get_industries(db: AsyncSession = Depends(get_db)):
    """Get list of industries"""
    result = await db.execute(select(CareerPath.industry).distinct())
    industries = [row[0] for row in result.all() if row[0]]
    
    return {"industries": industries}

@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get list of career categories"""
    result = await db.execute(select(CareerPath.category).distinct())
    categories = [row[0] for row in result.all() if row[0]]
    
    return {"categories": categories}

@router.get("/explore")
async def explore_careers(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Personalized career exploration based on student profile"""
    user_id = int(current_user["sub"])
    
    # Get user profile
    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    interests = profile.interests or [] if profile else []
    
    # Get all careers
    result = await db.execute(select(CareerPath))
    careers = result.scalars().all()
    
    # Score careers based on interests
    scored_careers = []
    for career in careers:
        score = 50  # Base score
        
        for interest in interests:
            if interest.lower() in career.title.lower():
                score += 20
            if interest.lower() in (career.industry or "").lower():
                score += 15
            if interest.lower() in (career.category or "").lower():
                score += 15
        
        scored_careers.append({
            "career": career,
            "score": min(score, 100)
        })
    
    # Sort and get top careers
    scored_careers.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "recommended_careers": [
            {
                "id": c["career"].id,
                "title": c["career"].title,
                "industry": c["career"].industry,
                "match_score": c["score"],
                "avg_salary_range": c["career"].avg_salary_range
            }
            for c in scored_careers[:5]
        ],
        "trending_careers": [
            {
                "id": c.id,
                "title": c.title,
                "industry": c.industry
            }
            for c in random.sample(careers, min(5, len(careers)))
        ]
    }
