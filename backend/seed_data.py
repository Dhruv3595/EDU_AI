
import asyncio
import os
import json
from dotenv import load_dotenv
from sqlalchemy import select

from database.connection import AsyncSessionLocal, init_db
from models.assessment import Subject, Question
from models.career import CareerPath, CareerRoadmap

load_dotenv()

async def seed_data():
    print("Initializing database...")
    await init_db()
    
    async with AsyncSessionLocal() as session:
        print("Checking existing data...")
        
        # Check Subjects
        result = await session.execute(select(Subject))
        subjects = result.scalars().all()
        
        if not subjects:
            print("Seeding subjects...")
            math = Subject(
                name="Mathematics",
                description="Study of numbers, formulas and related structures",
                grade_levels=["9", "10", "11", "12"],
                topics=["Algebra", "Geometry", "Calculus", "Trigonometry"]
            )
            physics = Subject(
                name="Physics",
                description="Study of matter, its motion and behavior through space and time",
                grade_levels=["9", "10", "11", "12"],
                topics=["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"]
            )
            cs = Subject(
                name="Computer Science",
                description="Study of computation, automation, and information",
                grade_levels=["10", "11", "12"],
                topics=["Programming", "Data Structures", "Algorithms", "Web Development"]
            )
            session.add_all([math, physics, cs])
            await session.flush()
            
            # Add Questions for Math
            print("Seeding questions...")
            q1 = Question(
                subject_id=math.id,
                topic="Algebra",
                difficulty=1,
                question_text="Solve for x: 2x + 5 = 15",
                options=["5", "10", "7.5", "2.5"],
                correct_answer="5",
                explanation="2x = 10, so x = 5"
            )
            q2 = Question(
                subject_id=math.id,
                topic="Calculus",
                difficulty=3,
                question_text="What is the derivative of x^2?",
                options=["x", "2x", "2", "x^2"],
                correct_answer="2x",
                explanation="Power rule: d/dx(x^n) = nx^(n-1)"
            )
            
            # Add Questions for CS
            q3 = Question(
                subject_id=cs.id,
                topic="Programming",
                difficulty=1,
                question_text="Which language is primarily used for web styling?",
                options=["HTML", "Python", "CSS", "Java"],
                correct_answer="CSS",
                explanation="CSS (Cascading Style Sheets) is used for styling web pages."
            )
             
            session.add_all([q1, q2, q3])
        else:
            print("Subjects already exist.")

        # Check Careers
        result = await session.execute(select(CareerPath))
        careers = result.scalars().all()
        
        if not careers:
            print("Seeding careers...")
            swe = CareerPath(
                title="Software Engineer",
                industry="Technology",
                category="STEM",
                description="Develops software solutions, web applications, and systems.",
                required_skills=["Python", "JavaScript", "SQL", "Problem Solving"],
                avg_salary_range={"min": 600000, "max": 2500000, "currency": "INR"},
                job_outlook="Very High Growth",
                growth_prospects="The demand for software developers is expected to grow 22% from 2020 to 2030."
            )
            
            ds = CareerPath(
                title="Data Scientist",
                industry="Technology",
                category="STEM",
                description="Analyzes complex data to help organizations make better decisions.",
                required_skills=["Python", "Statistics", "Machine Learning", "Data Visualization"],
                avg_salary_range={"min": 800000, "max": 3000000, "currency": "INR"},
                job_outlook="High Growth",
                growth_prospects="Data science is one of the fastest growing fields."
            )
            session.add_all([swe, ds])
            await session.flush()
            
            # Roadmaps
            r1 = CareerRoadmap(
                career_id=swe.id,
                title="Variables & Loops",
                stage="Entry Level",
                description="Learn the basics of programming logic.",
                order_index=1,
                time_estimate="1-2 months",
                milestones=["Learn Python Basic Syntax", "Understand Control Flow"]
            )
            r2 = CareerRoadmap(
                career_id=swe.id,
                title="Web Frameworks",
                stage="Mid Level",
                description="Learn to build web applications.",
                order_index=2,
                time_estimate="3-4 months",
                milestones=["Learn Django/FastAPI", "Learn React/Vue"]
            )
            session.add_all([r1, r2])
            
        else:
            print("Careers already exist.")
            
        await session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
