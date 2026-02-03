"""
EduAI - AI Education Platform Backend
FastAPI Application with AI/ML Integration
"""

from datetime import datetime
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Import routers (AFTER load_dotenv, BEFORE app creation)
from routers import auth, assessments, study_plans, career_guidance, ai_tutor, dashboard, admin, resources
from database.connection import init_db, close_db
from utils.logger import logger

# IMPORT ALL MODELS - CRITICAL: This creates database tables
from models import User, StudentProfile, Skill, StudentSkill, UserRole
from models import Subject, Question, Assessment, QuestionResponse
from models import StudyPlan, StudyTask, LearningResource, TaskStatus
from models import CareerPath, CareerRoadmap, AIConversation, Mentor

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting up EduAI Backend...")
    skip_db = os.getenv("SKIP_DB_INIT", "False").lower() == "true"
    if skip_db:
        logger.warning("SKIP_DB_INIT is true — skipping database initialization (local testing only)")
    else:
        await init_db()
        logger.info("Database initialized successfully")
        
        # Auto-seed if database is empty
        try:
            from seed_data import run_seed
            from database.connection import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                seeded = await run_seed(session)
                if seeded:
                    logger.info("Database auto-seeded successfully")
        except Exception as e:
            logger.error(f"Auto-seeding failed: {e}")
    yield
    # Shutdown
    logger.info("Shutting down EduAI Backend...")
    if skip_db:
        logger.warning("SKIP_DB_INIT is true — skipping database shutdown")
    else:
        await close_db()
        logger.info("Database connections closed")

# Create FastAPI app
app = FastAPI(
    title="EduAI - AI Education Platform API",
    description="""
    Advanced AI-powered education platform API with features:
    - Learning Gap Analysis
    - Multi-language Career Guidance
    - Personalized Study Plans
    - AI Tutor with RAG
    - Skill Assessment & Tracking
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Ultra-compatible CORS for Production
# Using allow_origins=["*"] with allow_credentials=False is the most reliable 
# way to prevent browser CORS blocks for public APIs using Bearer tokens.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/student", tags=["Student Dashboard"])
app.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
app.include_router(study_plans.router, prefix="/study-plans", tags=["Study Plans"])
app.include_router(career_guidance.router, prefix="/careers", tags=["Career Guidance"])
app.include_router(ai_tutor.router, prefix="/ai-tutor", tags=["AI Tutor"])
app.include_router(resources.router, prefix="/resources", tags=["Resources"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to EduAI API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "EduAI API",
        "timestamp": datetime.now().isoformat()
    }

# ONLY ONE if __name__ block at the very bottom
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true",
        workers=1 if os.getenv("DEBUG", "False").lower() == "true" else 4
    )