"""SQLite database setup with SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from .core.constants import DATABASE_URL
except ImportError:
    from core.constants import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    """Create all database tables declared on the SQLAlchemy Base metadata."""
    try:
        from . import models
    except ImportError:
        import models

    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a SQLAlchemy session and close it after request handling."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
