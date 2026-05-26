"""Personalized calibration REST endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

try:
    from .. import models, schemas
    from ..core.calibrator import run_calibration
    from ..database import get_db
    from .session import ensure_user
except ImportError:
    import models
    import schemas
    from core.calibrator import run_calibration
    from database import get_db
    from routers.session import ensure_user

router = APIRouter(prefix="/calibration", tags=["calibration"])


@router.post("/start")
def start_calibration(user_id: int = 1, db: DbSession = Depends(get_db)):
    """Return calibration instructions and ensure a user profile exists."""
    ensure_user(db, user_id)
    return {
        "user_id": user_id,
        "duration_seconds": 30,
        "instructions": "Look straight at camera, stay alert, and blink normally for 30 seconds.",
    }


@router.post("/save", response_model=schemas.UserOut)
def save_calibration(payload: schemas.CalibrationSave, db: DbSession = Depends(get_db)):
    """Save calibrated blink, EAR, and MAR thresholds to a user profile."""
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.calibration_blink_rate = payload.baseline_blink_rate
    user.calibration_ear_threshold = payload.ear_threshold
    user.calibration_mar_threshold = payload.mar_threshold
    db.commit()
    db.refresh(user)
    return user


@router.post("/compute")
def compute_calibration(samples: dict):
    """Compute calibration thresholds from frontend-collected sample arrays."""
    return run_calibration(
        samples.get("ear_samples", []),
        samples.get("mar_samples", []),
        samples.get("blink_events", []),
        int(samples.get("duration_seconds", 30)),
    )
