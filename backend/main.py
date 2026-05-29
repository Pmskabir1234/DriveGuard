"""
Copyright (c) 2026 Kabir

This Source Code Form is subject to the terms of the
Mozilla Public License, v. 2.0.
If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/
"""


"""FastAPI entry point for the Smart Driver Fatigue Detection System.

WebSocket protocol (client → server):
  The frontend sends JSON messages with a "frame" key containing a
  base64-encoded JPEG captured from the browser webcam:
    { "frame": "data:image/jpeg;base64,/9j/4AAQ..." }

WebSocket protocol (server → client):
  The server replies with a JSON detection-state object after each frame.
"""

import json
import time
from datetime import datetime
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

try:
    from . import models
    from .core.detector import FatigueDetector
    from .database import SessionLocal, init_db
    from .routers import analytics, calibration, events, session
    from .utils.logger import get_logger
except ImportError:
    import models
    from core.detector import FatigueDetector
    from database import SessionLocal, init_db
    from routers import analytics, calibration, events, session
    from utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


allowed_origins = os.getenv("ALLOWED_ORIGINS",'http://localhost:5173').split(",")

app = FastAPI(title="Smart Driver Fatigue & Drowsiness Detection System", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(session.router)
app.include_router(events.router)
app.include_router(calibration.router)
app.include_router(analytics.router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == 1).first()
        if not user:
            db.add(models.User(id=1, name="Demo Driver"))
            db.commit()
    finally:
        db.close()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


def _active_session_for_user(db, user_id: int) -> models.Session:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        user = models.User(id=user_id, name=f"Driver {user_id}")
        db.add(user)
        db.commit()
    active = (
        db.query(models.Session)
        .filter(models.Session.user_id == user_id, models.Session.ended_at.is_(None))
        .order_by(models.Session.started_at.desc())
        .first()
    )
    if active:
        return active
    active = models.Session(user_id=user_id)
    db.add(active)
    db.commit()
    db.refresh(active)
    return active


def _user_calibration(db, user_id: int) -> dict:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {}
    return {
        "blink_rate": user.calibration_blink_rate,
        "ear_threshold": user.calibration_ear_threshold,
        "mar_threshold": user.calibration_mar_threshold,
    }


def _event_type(frame_state: dict) -> str:
    if frame_state.get("phone_detected"):
        return "phone_detected"
    if not frame_state.get("face_detected", True):
        return "distracted"
    factors = frame_state.get("explanation", {}).get("contributing_factors", [])
    top = factors[0]["factor"] if factors else ""
    if "Yawn" in top:
        return "yawn"
    if "Head" in top:
        return "head_tilt"
    if "distraction" in top.lower():
        return "distracted"
    return "drowsy"


def _should_log(state: dict, last_risk: str | None, last_high_log: float) -> bool:
    risk = state.get("risk_level")
    if risk != last_risk:
        return True
    return risk == "High" and time.time() - last_high_log >= 30


def _log_event(db, session_id: int, state: dict) -> None:
    pose = state.get("head_pose", {})
    event = models.FatigueEvent(
        session_id=session_id,
        timestamp=datetime.utcnow(),
        event_type=_event_type(state),
        risk_level=state.get("risk_level", "Safe"),
        ear_value=state.get("ear", 0.0),
        mar_value=state.get("mar", 0.0),
        head_pitch=pose.get("pitch", 0.0),
        head_yaw=pose.get("yaw", 0.0),
        fatigue_score=state.get("fatigue_score", 0.0),
        explanation=json.dumps(state.get("explanation", {})),
    )
    db.add(event)
    db.commit()


@app.websocket("/ws/stream")
async def stream(websocket: WebSocket, user_id: int = Query(1)):
    """Receive webcam frames from the frontend, run detection, stream results back.

    Message format from client:
      { "frame": "<base64 JPEG>" }   — process this frame and reply with state
      { "ping": true }               — keepalive, reply with { "pong": true }
    """
    await websocket.accept()
    db = SessionLocal()
    last_risk: str | None = None
    last_high_log = 0.0

    try:
        active = _active_session_for_user(db, user_id)
        detector = FatigueDetector(_user_calibration(db, user_id))

        while True:
            try:
                message = await websocket.receive_json()
            except Exception:
                break

            # Keepalive ping
            if message.get("ping"):
                await websocket.send_json({"pong": True})
                continue

            # Frame processing
            b64_frame = message.get("frame")
            if not b64_frame:
                continue

            state = detector.process_b64_frame(b64_frame)
            state["session_id"] = active.id

            await websocket.send_json(state)

            if _should_log(state, last_risk, last_high_log):
                _log_event(db, active.id, state)
                if state.get("risk_level") == "High":
                    last_high_log = time.time()
                last_risk = state.get("risk_level")

            # Refresh calibration periodically
            db.expire_all()
            detector.user_calibration = _user_calibration(db, user_id)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for user_id=%s", user_id)
    finally:
        detector.close()
        db.close()
