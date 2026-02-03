"""
Database Connection and Session Management
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import text
import os
from utils.logger import logger

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:newpassword123@localhost:5432/eduai"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "False").lower() == "true",
    poolclass=NullPool,
    future=True
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()

async def init_db():
    """Initialize database tables"""
    try:
        async with engine.begin() as conn:
            # Try to create tables - if enum exists, it will skip
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        # Check if it's just the duplicate enum error
        if "already exists" in str(e) and "userrole" in str(e):
            logger.warning("Enum type already exists, continuing...")
            try:
                async with engine.begin() as conn:
                    # Try creating just tables without enums
                    await conn.run_sync(Base.metadata.create_all)
                logger.info("Database tables created successfully")
            except Exception as e2:
                logger.error(f"Error creating database tables: {e2}")
                raise e2
        else:
            logger.error(f"Error creating database tables: {e}")
            raise e

async def close_db():
    """Close database connections"""
    await engine.dispose()
    logger.info("Database engine disposed")

async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()