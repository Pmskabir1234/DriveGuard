"""Fatigue event REST endpoints."""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DbSession

try:
    from .. import models, schemas
    from ..database import get_db
except ImportError:
    import models
    import schemas
    from database import get_db

router = APIRouter(tags=["events"])


@router.post("/events", response_model=schemas.EventOut)
def create_event(payload: schemas.EventCreate, db: DbSession = Depends(get_db)):
    """Create a fatigue event for a session."""
    session = db.query(models.Session).filter(models.Session.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    event = models.FatigueEvent(
        session_id=payload.session_id,
        event_type=payload.event_type,
        risk_level=payload.risk_level,
        ear_value=payload.ear_value,
        mar_value=payload.mar_value,
        head_pitch=payload.head_pitch,
        head_yaw=payload.head_yaw,
        fatigue_score=payload.fatigue_score,
        explanation=json.dumps(payload.explanation),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/sessions/{session_id}/events", response_model=list[schemas.EventOut])
def list_session_events(session_id: int, db: DbSession = Depends(get_db)):
    """List all fatigue events for a session."""
    return (
        db.query(models.FatigueEvent)
        .filter(models.FatigueEvent.session_id == session_id)
        .order_by(models.FatigueEvent.timestamp.desc())
        .all()
    )


@router.get("/events/recent", response_model=list[schemas.EventOut])
def recent_events(user_id: int = Query(1), limit: int = Query(20, ge=1, le=100), db: DbSession = Depends(get_db)):
    """Return recent fatigue events across a user's sessions."""
    return (
        db.query(models.FatigueEvent)
        .join(models.Session)
        .filter(models.Session.user_id == user_id)
        .order_by(models.FatigueEvent.timestamp.desc())
        .limit(limit)
        .all()
    )
