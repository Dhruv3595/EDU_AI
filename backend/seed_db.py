"""
Seed database with initial data
"""
import asyncio
from database.connection import AsyncSessionLocal
from models.assessment import Subject

async def seed_database():
    print("Seeding database...")
    
    async with AsyncSessionLocal() as db:
        # Add subjects
        subjects_data = [
            {
                "name": "Mathematics",
                "description": "Fundamental mathematical concepts",
                "grade_levels": ["9", "10", "11", "12"],
                "topics": ["Algebra", "Geometry", "Calculus", "Statistics", "Trigonometry"]
            },
            {
                "name": "Computer Science",
                "description": "Programming and computer fundamentals",
                "grade_levels": ["9", "10", "11", "12"],
                "topics": ["Java", "Python", "Data Structures", "Algorithms", "Web Development"]
            },
            {
                "name": "Physics",
                "description": "Physical sciences and principles",
                "grade_levels": ["9", "10", "11", "12"],
                "topics": ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"]
            },
            {
                "name": "Chemistry",
                "description": "Chemical principles and reactions",
                "grade_levels": ["9", "10", "11", "12"],
                "topics": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"]
            }
        ]
        
        for subject_data in subjects_data:
            subject = Subject(**subject_data)
            db.add(subject)
        
        await db.commit()
        print(f"Added {len(subjects_data)} subjects")
    
    print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
