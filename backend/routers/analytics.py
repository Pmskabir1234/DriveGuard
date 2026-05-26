"""Historical fatigue analytics endpoints."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session as DbSession

try:
    from .. import models
    from ..database import get_db
except ImportError:
    import models
    from database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/daily")
def daily_stats(user_id: int = Query(1), db: DbSession = Depends(get_db)):
    """Return average fatigue score per day for the last seven days."""
    start = datetime.utcnow() - timedelta(days=7)
    rows = (
        db.query(func.date(models.Session.started_at), func.avg(models.Session.avg_fatigue_score))
        .filter(models.Session.user_id == user_id, models.Session.started_at >= start)
        .group_by(func.date(models.Session.started_at))
        .all()
    )
    return [{"date": str(day), "avg_score": round(float(avg or 0), 3)} for day, avg in rows]


@router.get("/trends")
def risk_trends(user_id: int = Query(1), db: DbSession = Depends(get_db)):
    """Return frequency breakdown of logged risk levels."""
    rows = (
        db.query(models.FatigueEvent.risk_level, func.count(models.FatigueEvent.id))
        .join(models.Session)
        .filter(models.Session.user_id == user_id)
        .group_by(models.FatigueEvent.risk_level)
        .all()
    )
    return [{"risk_level": level, "count": count} for level, count in rows]


@router.get("/summary")
def summary(user_id: int = Query(1), db: DbSession = Depends(get_db)):
    """Return aggregate session counts, average score, peak risk, and recent sessions."""
    sessions = (
        db.query(models.Session)
        .filter(models.Session.user_id == user_id)
        .order_by(models.Session.started_at.desc())
        .all()
    )
    peak_order = {"Safe": 0, "Moderate": 1, "High": 2}
    peak = max((s.peak_risk_level for s in sessions), key=lambda level: peak_order.get(level, 0), default="Safe")
    avg = sum(s.avg_fatigue_score for s in sessions) / len(sessions) if sessions else 0.0
    recent = [
        {
            "id": s.id,
            "date": s.started_at.isoformat(),
            "duration_seconds": int(((s.ended_at or datetime.utcnow()) - s.started_at).total_seconds()),
            "peak_risk": s.peak_risk_level,
            "avg_score": round(s.avg_fatigue_score, 3),
        }
        for s in sessions[:10]
    ]
    return {"total_sessions": len(sessions), "avg_score": round(avg, 3), "peak_risk": peak, "recent_sessions": recent}
