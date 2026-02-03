import os
import json
import requests
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from utils.logger import logger

def generate_ai_study_plan(
    subject: str,
    topics: List[str],
    start_date: date,
    end_date: date,
    daily_hours: float,
    current_knowledge: str = "Beginner",
    focus_areas: List[str] = None
) -> Dict[str, Any]:
    """
    Generate a study plan using Google Gemini API, inspired by roadmap.sh curriculums.
    """
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    if not gemini_key:
        logger.warning("GEMINI_API_KEY not found. Falling back to algorithmic plan.")
        print("DEBUG: GEMINI_API_KEY missing, using fallback.")
        return generate_algorithmic_fallback(topics, start_date, end_date, daily_hours)

    # Calculate total days
    total_days = (end_date - start_date).days + 1
    
    # Professional-grade Prompt for "Gemini-like" quality
    prompt = f"""
    You are an AI Education Expert and Curriculum Designer. Your goal is to create a high-impact, personalized learning roadmap for {subject} that rivals the quality of professional educational platforms and personal tutors.

    STUDENT PROFILE:
    - Subject: {subject}
    - Specific Topics to Master: {', '.join(topics)}
    - Level: {current_knowledge}
    - Availability: {daily_hours} hours per day
    - Duration: {total_days} days (Starting {start_date} to {end_date})
    {f"- Critical Focus Areas: {', '.join(focus_areas)}" if focus_areas else ""}

    CURRICULUM ARCHITECTURE REQUIREMENTS:
    1. SCAFFOLDING: Start with foundational concepts and logically build toward advanced applications.
    2. VARIETY: Balance deep reading ('study'), active solving ('practice'), and periodic 'review' (using spaced repetition logic).
    3. REAL-WORLD PROJECTS: Include small milestones or "mini-projects" every few days to apply knowledge.
    4. RICH METADATA: Each task title must be specific and descriptive. The 'description' must be exhaustive, explaining *why* this matters.
    5. CURATED RESOURCES: Provide specific, high-quality search keywords or platforms. Use markdown formatting in descriptions.

    OUTPUT INSTRUCTIONS:
    - RETURN ONLY RAW JSON.
    - NO MARKDOWN, NO COMMENTARY outside the JSON.
    - Ensure exactly one coherent task set per day for {total_days} days.

    JSON SCHEMA:
    {{
      "plan_metadata": {{
          "curriculum_goal": "A one-sentence vision for this plan",
          "learning_tactics": [
              "Tip 1 (e.g., 'Use Feynman technique for X')",
              "Tip 2 (e.g., 'Active recall for formula Y')",
              "Tip 3",
              "Tip 4"
          ],
          "estimated_difficulty": "Beginner/Intermediate/Advanced"
      }},
      "tasks": [
        {{
          "scheduled_date": "YYYY-MM-DD",
          "topic": "Professional Concept Title (e.g., 'Mastering Async/Await Patterns')",
          "subtopic": "Specific niche area",
          "description": "Exhaustive, encouraging instructions. Use bullet points if helpful.",
          "task_type": "study" | "practice" | "review",
          "duration_minutes": {int(daily_hours * 60)},
          "priority": 1-3,
          "resources": ["Specific Resource Link or Search Term 1", "Search Term 2"],
          "pro_tip": "A small tip for better retention"
        }}
      ]
    }}
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_key}"
    
    try:
        print(f"DEBUG: Calling Gemini API for {subject} plan...")
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7, 
                    "response_mime_type": "application/json",
                    "maxOutputTokens": 4000
                }
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            try:
                if "candidates" in data and data["candidates"]:
                    text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                    text_content = text_content.replace("```json", "").replace("```", "").strip()
                    plan_json = json.loads(text_content)
                    
                    tasks = []
                    provided_tasks = plan_json.get("tasks", [])
                    
                    for i, task in enumerate(provided_tasks):
                        if i >= total_days: break
                        
                        target_date = start_date + timedelta(days=i)
                        
                        task["scheduled_date"] = target_date.isoformat()
                        task["duration_minutes"] = task.get("duration_minutes", int(daily_hours * 60))
                        task["priority"] = task.get("priority", 2)
                        
                        # Enrich description with pro-tip
                        if "pro_tip" in task:
                            task["description"] = f"{task['description']}\n\n💡 Pro-tip: {task['pro_tip']}"

                        # Fix generic topics
                        if task["topic"].lower() == subject.lower() or task["topic"].lower() in [t.lower() for t in topics]:
                             task["topic"] = f"{task['topic']}: {task.get('subtopic', 'Core Concepts')}"

                        tasks.append(task)
                    
                    logger.info(f"AI Plan generated with {len(tasks)} tasks")
                    return {
                        "topics": topics, 
                        "daily_hours": daily_hours, 
                        "tasks": tasks,
                        "metadata": plan_json.get("plan_metadata", {})
                    }
                else:
                    logger.error(f"Gemini response has no candidates: {data}")
                    return generate_algorithmic_fallback(topics, start_date, end_date, daily_hours)

            except (KeyError, json.JSONDecodeError) as e:
                logger.error(f"Failed to parse AI response: {e}")
                return generate_algorithmic_fallback(topics, start_date, end_date, daily_hours)
        else:
            logger.error(f"Gemini API failed {response.status_code}: {response.text}")
            return generate_algorithmic_fallback(topics, start_date, end_date, daily_hours)
            
    except Exception as e:
        logger.error(f"Error calling AI service: {e}")
        return generate_algorithmic_fallback(topics, start_date, end_date, daily_hours)

def generate_algorithmic_fallback(topics, start_date, end_date, daily_hours):
    """Refined algorithmic generation with educational structure"""
    logger.info("Using algorithmic fallback for study plan")
    tasks = []
    total_days = (end_date - start_date).days + 1
    daily_minutes = int(daily_hours * 60)
    
    subtopic_templates = [
        {"name": "Foundations & Fundamentals", "desc": "Grasp the core logic and terminology. Focus on 'Why' it works."},
        {"name": "Step-by-Step Implementation", "desc": "Follow a tutorial to build your first working example."},
        {"name": "Pattern Recognition", "desc": "Solve 3-5 variants of standard problems to build instinct."},
        {"name": "Debugging & Troubleshooting", "desc": "Deliberately break your code/solution and fix it."},
        {"name": "Deep Architectural Review", "desc": "Analyze the theory and best practices used in the industry."},
        {"name": "Consolidation Challenge", "desc": "Synthesize everything learned into a final review session."}
    ]
    
    topic_idx = 0
    sub_idx = 0
    
    for i in range(total_days):
        day_date = start_date + timedelta(days=i)
        
        current_topic = topics[topic_idx % len(topics)]
        sub_info = subtopic_templates[sub_idx % len(subtopic_templates)]
        
        sub_idx += 1
        if sub_idx % len(subtopic_templates) == 0:
            topic_idx += 1
            
        tasks.append({
            "topic": f"{current_topic}: {sub_info['name']}",
            "subtopic": sub_info['name'],
            "description": f"{sub_info['desc']} This path ensures you master {current_topic} from first principles.",
            "task_type": "study" if i % 2 == 0 else "practice",
            "scheduled_date": day_date.isoformat(),
            "duration_minutes": daily_minutes,
            "priority": 2,
            "resources": [f"{current_topic} study guide", f"{current_topic} practice labs"]
        })
            
    return {
        "topics": topics,
        "daily_hours": daily_hours,
        "tasks": tasks,
        "metadata": {
            "curriculum_goal": f"Master the foundations of {topics[0] if topics else 'the subject'}",
            "learning_tactics": [
                "Focus on first principles",
                "Practice active recall",
                "Build small experiments",
                "Teach concepts to others"
            ]
        }
    }
