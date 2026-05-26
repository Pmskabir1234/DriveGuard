"""Pydantic request and response schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    """Request body for creating a simple user profile."""

    name: str = "Demo Driver"


class UserOut(BaseModel):
    """Serialized user profile."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    created_at: datetime
    calibration_blink_rate: float
    calibration_ear_threshold: float
    calibration_mar_threshold: float


class SessionStart(BaseModel):
    """Request body for starting a monitoring session."""

    user_id: int = 1


class SessionOut(BaseModel):
    """Serialized monitoring session."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    started_at: datetime
    ended_at: datetime | None = None
    total_yawns: int
    total_blinks: int
    avg_fatigue_score: float
    peak_risk_level: str


class EventCreate(BaseModel):
    """Request body for manually logging a fatigue event."""

    session_id: int
    event_type: str
    risk_level: str
    ear_value: float = 0.0
    mar_value: float = 0.0
    head_pitch: float = 0.0
    head_yaw: float = 0.0
    fatigue_score: float = 0.0
    explanation: dict[str, Any] = Field(default_factory=dict)


class EventOut(BaseModel):
    """Serialized fatigue event."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    session_id: int
    timestamp: datetime
    event_type: str
    risk_level: str
    ear_value: float
    mar_value: float
    head_pitch: float
    head_yaw: float
    fatigue_score: float
    explanation: str


class CalibrationSave(BaseModel):
    """Request body for saving calibration results."""

    user_id: int = 1
    baseline_blink_rate: float
    ear_threshold: float
    mar_threshold: float
