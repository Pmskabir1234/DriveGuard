"""SQLAlchemy models for users, monitoring sessions, and fatigue events."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

try:
    from .database import Base
except ImportError:
    from database import Base


class User(Base):
    """Driver profile with personalized fatigue calibration values."""

    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Demo Driver", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    calibration_blink_rate = Column(Float, default=15.0, nullable=False)
    calibration_ear_threshold = Column(Float, default=0.25, nullable=False)
    calibration_mar_threshold = Column(Float, default=0.6, nullable=False)
    sessions = relationship("Session", back_populates="user")


class Session(Base):
    """A monitoring session with aggregate fatigue statistics."""

    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    total_yawns = Column(Integer, default=0, nullable=False)
    total_blinks = Column(Integer, default=0, nullable=False)
    avg_fatigue_score = Column(Float, default=0.0, nullable=False)
    peak_risk_level = Column(String, default="Safe", nullable=False)
    user = relationship("User", back_populates="sessions")
    events = relationship("FatigueEvent", back_populates="session", cascade="all, delete-orphan")


class FatigueEvent(Base):
    """A fatigue risk event logged when risk changes or remains high periodically."""

    __tablename__ = "fatigue_events"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    event_type = Column(String, nullable=False)
    risk_level = Column(String, nullable=False)
    ear_value = Column(Float, default=0.0, nullable=False)
    mar_value = Column(Float, default=0.0, nullable=False)
    head_pitch = Column(Float, default=0.0, nullable=False)
    head_yaw = Column(Float, default=0.0, nullable=False)
    fatigue_score = Column(Float, default=0.0, nullable=False)
    explanation = Column(Text, default="{}", nullable=False)
    session = relationship("Session", back_populates="events")
