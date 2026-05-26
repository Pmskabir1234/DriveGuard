"""Session lifecycle REST endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

try:
    from .. import models, schemas
    from ..database import get_db
except ImportError:
    import models
    import schemas
    from database import get_db

router = APIRouter(prefix="/sessions", tags=["sessions"])
RISK_RANK = {"Safe": 0, "Moderate": 1, "High": 2}


def ensure_user(db: DbSession, user_id: int) -> models.User:
    """Return an existing user or create a demo user for the requested id."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        return user
    user = models.User(id=user_id, name=f"Driver {user_id}")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/start", response_model=schemas.SessionOut)
def start_session(payload: schemas.SessionStart, db: DbSession = Depends(get_db)):
    """Create and return a new active monitoring session."""
    ensure_user(db, payload.user_id)
    session = models.Session(user_id=payload.user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/end", response_model=schemas.SessionOut)
def end_session(session_id: int, db: DbSession = Depends(get_db)):
    """Finalize a session using its logged fatigue events."""
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    events = db.query(models.FatigueEvent).filter(models.FatigueEvent.session_id == session_id).all()
    session.ended_at = datetime.utcnow()
    if events:
        session.avg_fatigue_score = sum(event.fatigue_score for event in events) / len(events)
        session.peak_risk_level = max((event.risk_level for event in events), key=lambda level: RISK_RANK.get(level, 0))
        session.total_yawns = sum(1 for event in events if event.event_type == "yawn")
        session.total_blinks = sum(1 for event in events if event.event_type == "drowsy")
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=schemas.SessionOut)
def get_session(session_id: int, db: DbSession = Depends(get_db)):
    """Return one monitoring session by id."""
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
