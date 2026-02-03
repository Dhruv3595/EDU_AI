"""
Assessment Router - AI Learning Gap Analysis
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random

from database.connection import get_db
from models.assessment import Subject, Question, Assessment, QuestionResponse
from models.user import User
from utils.security import get_current_user
from utils.logger import logger

router = APIRouter()

# Pydantic Models
class AnswerSubmission(BaseModel):
    question_id: int
    answer: str
    time_taken_seconds: int

class AssessmentSubmit(BaseModel):
    answers: List[AnswerSubmission]

@router.get("/subjects")
async def get_subjects(db: AsyncSession = Depends(get_db)):
    """Get all available subjects"""
    result = await db.execute(select(Subject))
    subjects = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "grade_levels": s.grade_levels,
            "topics": s.topics
        }
        for s in subjects
    ]

@router.post("/start")
async def start_assessment(
    subject_id: int,
    topic: Optional[str] = None,
    difficulty: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new assessment"""
    user_id = int(current_user["sub"])
    
    # Verify subject exists
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get questions for assessment
    query = select(Question).where(Question.subject_id == subject_id)
    if topic:
        query = query.where(Question.topic == topic)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
    
    result = await db.execute(query)
    all_questions = result.scalars().all()
    
    # Select 10 random questions (or fewer if not enough)
    num_questions = min(10, len(all_questions))
    selected_questions = random.sample(all_questions, num_questions) if len(all_questions) >= num_questions else all_questions
    
    # Create assessment
    assessment = Assessment(
        user_id=user_id,
        subject_id=subject_id,
        title=f"{subject.name} Assessment",
        total_questions=len(selected_questions),
        status="in_progress"
    )
    
    db.add(assessment)
    await db.flush()
    
    logger.info(f"Assessment started: {assessment.id} for user {user_id}")
    
    return {
        "assessment_id": assessment.id,
        "title": assessment.title,
        "total_questions": assessment.total_questions,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_text_translations": q.question_text_translations,
                "options": q.options,
                "options_translations": q.options_translations,
                "difficulty": q.difficulty,
                "topic": q.topic,
                "time_limit_seconds": q.time_limit_seconds
            }
            for q in selected_questions
        ]
    }

@router.post("/{assessment_id}/submit")
async def submit_assessment(
    assessment_id: int,
    submission: AssessmentSubmit,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit assessment answers and get gap analysis"""
    user_id = int(current_user["sub"])
    
    # Get assessment
    result = await db.execute(
        select(Assessment).where(
            (Assessment.id == assessment_id) &
            (Assessment.user_id == user_id)
        )
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    if assessment.status == "completed":
        raise HTTPException(status_code=400, detail="Assessment already completed")
    
    # Process answers
    correct_count = 0
    topic_performance = {}
    
    for answer in submission.answers:
        # Get question
        result = await db.execute(select(Question).where(Question.id == answer.question_id))
        question = result.scalar_one_or_none()
        
        if not question:
            continue
        
        is_correct = answer.answer == question.correct_answer
        if is_correct:
            correct_count += 1
        
        # Track performance by topic
        topic = question.topic
        if topic not in topic_performance:
            topic_performance[topic] = {"correct": 0, "total": 0}
        topic_performance[topic]["total"] += 1
        if is_correct:
            topic_performance[topic]["correct"] += 1
        
        # Save response
        response = QuestionResponse(
            assessment_id=assessment_id,
            question_id=answer.question_id,
            selected_answer=answer.answer,
            is_correct=is_correct,
            time_taken_seconds=answer.time_taken_seconds
        )
        db.add(response)
    
    # Calculate score
    score = (correct_count / len(submission.answers) * 100) if submission.answers else 0
    
    # Generate gap analysis
    gap_analysis = generate_gap_analysis(topic_performance)
    
    # Update assessment
    assessment.correct_answers = correct_count
    assessment.answered_questions = len(submission.answers)
    assessment.score = score
    assessment.status = "completed"
    assessment.completed_at = datetime.utcnow()
    assessment.gap_analysis = gap_analysis
    assessment.recommendations = generate_recommendations(gap_analysis)
    
    await db.commit()
    
    logger.info(f"Assessment completed: {assessment_id}, Score: {score}%")
    
    return {
        "assessment_id": assessment.id,
        "score": score,
        "correct_answers": correct_count,
        "total_questions": assessment.total_questions,
        "gap_analysis": gap_analysis,
        "recommendations": assessment.recommendations,
        "topic_performance": topic_performance
    }

def generate_gap_analysis(topic_performance):
    """AI-powered gap analysis based on topic performance"""
    gaps = []
    strengths = []
    
    for topic, performance in topic_performance.items():
        accuracy = (performance["correct"] / performance["total"] * 100) if performance["total"] > 0 else 0
        
        if accuracy < 50:
            gaps.append({
                "topic": topic,
                "accuracy": accuracy,
                "severity": "high" if accuracy < 30 else "medium"
            })
        elif accuracy >= 80:
            strengths.append({
                "topic": topic,
                "accuracy": accuracy
            })
    
    return {
        "gaps": gaps,
        "strengths": strengths,
        "overall_level": calculate_level(topic_performance)
    }

def calculate_level(topic_performance):
    """Calculate overall proficiency level"""
    if not topic_performance:
        return "beginner"
    
    total_correct = sum(p["correct"] for p in topic_performance.values())
    total_questions = sum(p["total"] for p in topic_performance.values())
    
    accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0
    
    if accuracy >= 80:
        return "advanced"
    elif accuracy >= 60:
        return "intermediate"
    else:
        return "beginner"

def generate_recommendations(gap_analysis):
    """Generate personalized study recommendations"""
    recommendations = []
    
    for gap in gap_analysis.get("gaps", []):
        topic = gap["topic"]
        severity = gap["severity"]
        
        if severity == "high":
            recommendations.append(f"Priority: Review fundamentals of {topic}")
            recommendations.append(f"Watch video tutorials on {topic}")
        else:
            recommendations.append(f"Practice more problems on {topic}")
    
    if not recommendations:
        recommendations.append("Great job! Move on to advanced topics.")
    
    return recommendations

@router.get("/{assessment_id}/results")
async def get_assessment_results(
    assessment_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed assessment results"""
    user_id = int(current_user["sub"])
    
    result = await db.execute(
        select(Assessment, Subject)
        .join(Subject)
        .where(
            (Assessment.id == assessment_id) &
            (Assessment.user_id == user_id)
        )
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    assessment, subject = row
    
    # Get responses with question details
    result = await db.execute(
        select(QuestionResponse, Question)
        .join(Question)
        .where(QuestionResponse.assessment_id == assessment_id)
    )
    responses = []
    for resp_row in result.all():
        response, question = resp_row
        responses.append({
            "question_id": response.question_id,
            "question_text": question.question_text,
            "your_answer": response.selected_answer,
            "correct_answer": question.correct_answer,
            "is_correct": response.is_correct,
            "explanation": question.explanation,
            "topic": question.topic
        })
    
    return {
        "assessment_id": assessment.id,
        "subject": subject.name,
        "score": assessment.score,
        "correct_answers": assessment.correct_answers,
        "total_questions": assessment.total_questions,
        "completed_at": assessment.completed_at,
        "gap_analysis": assessment.gap_analysis,
        "recommendations": assessment.recommendations,
        "responses": responses
    }
