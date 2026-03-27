from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


engine = create_engine(settings.database_url)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def create_tables():
    """Create all tables defined in ORM models if they don't exist."""
    from app.db import models  # noqa: F401 — import triggers model registration
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    FastAPI dependency — yields a DB session per request, always closes it.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
