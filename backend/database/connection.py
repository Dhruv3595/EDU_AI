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

# Handle Render/Heroku URLs (convert postgres:// to postgresql+asyncpg://)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Debugging: Extract host for logging (masking credentials)
try:
    # URL format: driver://user:pass@host:port/db
    db_host = DATABASE_URL.split("@")[-1].split("/")[0].split(":")[0]
except Exception:
    db_host = "unknown"

logger.info(f"Database Initialization: connecting to host '{db_host}'...")

# Create async engine with SSL requirement for production
engine_args = {
    "echo": os.getenv("DEBUG", "False").lower() == "true",
    "poolclass": NullPool,
}

# Add SSL for non-localhost connections
if "localhost" not in db_host and "127.0.0.1" not in db_host:
    # Render and other cloud providers often use self-signed certs for internal DBs
    # We use 'require' to ensure encryption while allowing self-signed certs
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    engine_args["connect_args"] = {"ssl": ctx}

engine = create_async_engine(DATABASE_URL, **engine_args)

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