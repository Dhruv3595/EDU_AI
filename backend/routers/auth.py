"""
Authentication Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta

from database.connection import get_db
from models.user import User, StudentProfile, UserRole
from utils.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    get_current_user
)
from utils.logger import logger

router = APIRouter()

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    grade: Optional[str] = None
    preferred_language: str = "en"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    grade: Optional[str] = None
    preferred_language: Optional[str] = None
    learning_style: Optional[str] = None
    study_hours_per_day: Optional[int] = None
    academic_goals: Optional[str] = None
    interests: Optional[list] = None

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=UserRole.STUDENT
    )
    
    db.add(new_user)
    await db.flush()  # Get the user ID
    
    # Create student profile
    profile = StudentProfile(
        user_id=new_user.id,
        grade=user_data.grade,
        preferred_language=user_data.preferred_language
    )
    db.add(profile)
    await db.commit()
    
    logger.info(f"New user registered: {user_data.email}")
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """User login"""
    # Find user
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    logger.info(f"User logged in: {credentials.email}")
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value
        }
    }

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """Refresh access token"""
    from utils.security import decode_token
    
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        new_access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
        
        return {"access_token": new_access_token, "token_type": "bearer"}
    
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user profile"""
    user_id = int(current_user["sub"])
    result = await db.execute(
        select(User, StudentProfile).join(StudentProfile, User.id == StudentProfile.user_id).where(User.id == user_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    
    user, profile = row
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "profile": {
            "grade": profile.grade,
            "preferred_language": profile.preferred_language,
            "learning_style": profile.learning_style,
            "study_hours_per_day": profile.study_hours_per_day,
            "academic_goals": profile.academic_goals,
            "interests": profile.interests,
            "strengths": profile.strengths,
            "weaknesses": profile.weaknesses
        }
    }

@router.put("/profile")
async def update_profile(
    update_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile"""
    user_id = int(current_user["sub"])
    
    # Update user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if update_data.full_name:
        user.full_name = update_data.full_name
    
    # Update profile
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    
    if profile:
        if update_data.grade:
            profile.grade = update_data.grade
        if update_data.preferred_language:
            profile.preferred_language = update_data.preferred_language
        if update_data.learning_style:
            profile.learning_style = update_data.learning_style
        if update_data.study_hours_per_day:
            profile.study_hours_per_day = update_data.study_hours_per_day
        if update_data.academic_goals:
            profile.academic_goals = update_data.academic_goals
        if update_data.interests:
            profile.interests = update_data.interests
    
    await db.commit()
    logger.info(f"Profile updated for user: {user_id}")
    
    return {"message": "Profile updated successfully"}

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """User logout - invalidate token on client side"""
    logger.info(f"User logged out: {current_user.get('email')}")
    return {"message": "Logged out successfully"}
