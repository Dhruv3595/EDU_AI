"""
AI Tutor Router - Gemini API integration for all education levels
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import requests
import os
import time

from database.connection import get_db
from models.career import AIConversation
from models.user import User, StudentProfile
from utils.security import get_current_user
from utils.logger import logger

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    language: str = "en"
    context: Optional[dict] = None
    grade_level: Optional[str] = None  # "1-10", "11-12", "engineering", "commerce", "arts"

# Free models available on OpenRouter
FREE_MODELS = [
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free"
]

EDUCATION_PROMPTS = {
    "1-10": """You are a patient tutor for students in classes 1-10. 
    Explain concepts simply with examples. Use encouragement. Keep answers short and clear.""",
    
    "11-12": """You are a tutor for high school students (classes 11-12). 
    Explain JEE/NEET level concepts. Include formulas and problem-solving steps.""",
    
    "engineering": """You are an engineering tutor. Explain B.Tech concepts deeply. 
    Include practical applications, formulas, and technical details.""",
    
    "commerce": """You are a commerce tutor. Explain accounting, economics, business studies. 
    Use real-world business examples. Include calculations where relevant.""",
    
    "arts": """You are an arts and humanities tutor. Explain history, literature, psychology, sociology. 
    Use storytelling and connect to real-life examples.""",
    
    "default": """You are EduAI, a helpful tutor. Adapt your explanation to the student's level."""
}

def get_system_prompt(grade_level: str) -> str:
    return EDUCATION_PROMPTS.get(grade_level, EDUCATION_PROMPTS["default"])

@router.post("/chat")
async def chat_with_tutor(
    chat_data: ChatMessage,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Chat with AI tutor - works for all education levels"""
    user_id = int(current_user["sub"])
    
    # Get user's grade from profile if not provided
    if not chat_data.grade_level:
        result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if profile and profile.grade:
            grade = profile.grade.lower()
            if "10" in grade or "9" in grade or "8" in grade:
                chat_data.grade_level = "1-10"
            elif "12" in grade or "11" in grade:
                chat_data.grade_level = "11-12"
            else:
                chat_data.grade_level = "default"
    
    # Try multiple free models
    ai_text = None
    model_used = None
    # Prefer Google Gemini if API key and model provided in env
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")  # e.g. "gemini-1.5-flash" or "gemini-1.5-pro" or "gemini-2.0-flash-exp"
    
    # List of Gemini models to try in order (newest/best first)
    gemini_models_to_try = [
        gemini_model,  # User-specified model first
        "gemini-2.0-flash-exp",  # Latest experimental
        "gemini-1.5-flash",  # Stable 1.5
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-pro"  # Older model name
    ]
    
    # Remove duplicates while preserving order
    seen = set()
    gemini_models_to_try = [x for x in gemini_models_to_try if not (x in seen or seen.add(x))]
    
    if gemini_key:
        system_prompt = get_system_prompt(chat_data.grade_level or "default")
        full_message = f"{system_prompt}\n\nUser: {chat_data.message}"
        
        # Try each model in sequence until one works
        for try_model in gemini_models_to_try:
            try:
                # Use the correct Gemini API v1 endpoint
                url = f"https://generativelanguage.googleapis.com/v1/models/{try_model}:generateContent?key={gemini_key}"

                resp = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{
                            "parts": [{"text": full_message}]
                        }],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 800
                        }
                    },
                    timeout=30
                )

                if resp.status_code == 200:
                    data = resp.json()
                    # Parse Gemini API response: candidates[0].content.parts[0].text
                    if "candidates" in data and len(data["candidates"]) > 0:
                        candidate = data["candidates"][0]
                        if "content" in candidate and "parts" in candidate["content"]:
                            parts = candidate["content"]["parts"]
                            if len(parts) > 0 and "text" in parts[0]:
                                ai_text = parts[0]["text"]
                                model_used = try_model
                                logger.info(f"AI response using Google Gemini model: {try_model}")
                                break  # Success! Exit the loop
                            else:
                                logger.warning(f"Gemini {try_model} response missing text in parts: {data}")
                        else:
                            logger.warning(f"Gemini {try_model} response missing content/parts: {data}")
                    else:
                        logger.warning(f"Gemini {try_model} response missing candidates: {data}")
                else:
                    logger.warning(f"Gemini model {try_model} failed: status={resp.status_code} body={resp.text[:200]}")
                    continue  # Try next model
                    
            except Exception as e:
                logger.error(f"Error calling Gemini API with model {try_model}: {e}")
                continue  # Try next model


    for model in FREE_MODELS:
        try:
            system_prompt = get_system_prompt(chat_data.grade_level or "default")
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": "Bearer sk-or-v1-demo",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "EduAI"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": chat_data.message}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                # OpenRouter / OpenAI-like response shape
                if isinstance(data.get("choices"), list) and data["choices"]:
                    ai_text = data["choices"][0].get("message", {}).get("content") or data["choices"][0].get("text")
                # legacy key
                if not ai_text:
                    ai_text = data.get("text") or data.get("response")

                if ai_text:
                    model_used = model
                    logger.info(f"AI response using model: {model}")
                    break
            else:
                logger.warning(f"Model {model} failed: {response.status_code}")
                continue
                
        except Exception as e:
            logger.error(f"Error with model {model}: {e}")
            continue
    
    # Fallback to smart local responses if all APIs fail
    if not ai_text:
        ai_text = get_local_response(chat_data.message, chat_data.grade_level)
    
    # Save conversation
    conversation = AIConversation(
        user_id=user_id,
        session_id=f"{user_id}_{datetime.utcnow().strftime('%Y%m%d')}",
        message=chat_data.message,
        response=ai_text,
        message_language=chat_data.language,
        detected_intent=detect_intent(chat_data.message),
        context_data={
            "grade_level": chat_data.grade_level,
            **(chat_data.context or {})
        }
    )
    db.add(conversation)
    await db.commit()
    
    return {
        "response": ai_text,
        "grade_level": chat_data.grade_level,
        "model_used": model_used if model_used else "local_fallback"
    }


@router.get("/test-gemini")
def test_gemini():
    """Temporary unauthenticated endpoint to verify Gemini connectivity and response.

    WARNING: This endpoint is unauthenticated and intended for local testing only.
    Remove or protect it before deploying to production.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    if not gemini_key:
        return {"ok": False, "error": "GEMINI_API_KEY not configured in environment"}

    prompt = "You are a helpful assistant. Reply briefly: What is recursion?"

    # Use the correct Gemini API v1 endpoint
    url = f"https://generativelanguage.googleapis.com/v1/models/{gemini_model}:generateContent?key={gemini_key}"

    attempts = 3
    backoff = 1
    last_err = None
    for attempt in range(1, attempts + 1):
        try:
            resp = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 200
                    }
                },
                timeout=15
            )
            if resp.status_code != 200:
                last_err = f"status={resp.status_code} body={resp.text}"
                time.sleep(backoff)
                backoff *= 2
                continue

            data = resp.json()
            # Parse Gemini API response: candidates[0].content.parts[0].text
            text = None
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    if len(parts) > 0 and "text" in parts[0]:
                        text = parts[0]["text"]

            if text:
                return {"ok": True, "model": gemini_model, "response": text, "raw": data}
            else:
                last_err = f"Response structure unexpected: {data}"
                time.sleep(backoff)
                backoff *= 2
                continue

        except Exception as e:
            last_err = str(e)
            time.sleep(backoff)
            backoff *= 2
            continue

    return {"ok": False, "error": "Gemini API call failed", "detail": last_err}

def get_local_response(message: str, grade_level: str) -> str:
    """Fallback responses when API fails"""
    responses = {
        "math": f"As a {grade_level or 'student'}, let's break this down step by step...",
        "science": f"Great science question! For {grade_level or 'your level'}, here's the explanation...",
        "default": "I'm here to help! Could you provide more details about what you're studying?"
    }
    
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["math", "calculate", "solve", "equation", "+", "-", "*", "/"]):
        return responses["math"]
    elif any(w in msg_lower for w in ["science", "physics", "chemistry", "biology"]):
        return responses["science"]
    return responses["default"]

def detect_intent(message: str) -> str:
    """Detect what the student is asking about"""
    msg_lower = message.lower()
    
    intents = {
        "math": ["math", "calculate", "solve", "equation", "algebra", "geometry", "trigonometry", "calculus"],
        "physics": ["physics", "force", "motion", "energy", "electricity", "magnetism"],
        "chemistry": ["chemistry", "chemical", "reaction", "element", "compound", "molecule"],
        "biology": ["biology", "cell", "organism", "plant", "animal", "human body"],
        "commerce": ["accounting", "economics", "business", "finance", "market"],
        "arts": ["history", "literature", "psychology", "sociology", "philosophy"],
        "coding": ["programming", "code", "python", "javascript", "algorithm"],
        "career": ["career", "job", "future", "scope", "salary"]
    }
    
    for intent, keywords in intents.items():
        if any(k in msg_lower for k in keywords):
            return intent
    return "general"

@router.get("/history")
async def get_chat_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat history"""
    user_id = int(current_user["sub"])
    result = await db.execute(
        select(AIConversation)
        .where(AIConversation.user_id == user_id)
        .order_by(desc(AIConversation.created_at))
        .limit(limit)
    )
    conversations = result.scalars().all()
    
    return {
        "conversations": [
            {
                "id": conv.id,
                "message": conv.message,
                "response": conv.response,
                "intent": conv.detected_intent,
                "timestamp": conv.created_at
            }
            for conv in conversations
        ]
    }

@router.post("/clear-history")
async def clear_chat_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Clear all chat history for the current user"""
    user_id = int(current_user["sub"])
    
    await db.execute(
        delete(AIConversation).where(AIConversation.user_id == user_id)
    )
    await db.commit()
    
    logger.info(f"Cleared chat history for user {user_id}")
    return {"message": "Chat history cleared successfully"}