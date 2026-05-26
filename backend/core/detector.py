"""Frame-based detection orchestrator.

The frontend captures webcam frames and sends them as base64-encoded JPEG
over the WebSocket.  This module decodes each frame and runs the full
detection pipeline on it — no backend camera access required.
"""

import base64
import time
from collections import deque
from datetime import datetime
import os

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision
from mediapipe.tasks.python.vision import (
    FaceLandmarker,
    FaceLandmarkerOptions,
    RunningMode,
)

try:
    from ..alerts.alert_manager import AlertManager
    from ..utils.logger import get_logger
    from .constants import EAR_THRESHOLD_DEFAULT, FRAME_RATE, MAR_THRESHOLD_DEFAULT
    from .distraction import DistractionDetector, get_gaze_direction
    from .explainer import generate_explanation
    from .eye_tracker import average_ear, detect_prolonged_closure, get_blink_rate, is_eye_closed
    from .fatigue_scorer import classify_risk, compute_score
    from .head_pose import classify_pose, detect_microsleep_nod, estimate_head_pose
    from .predictor import predict_fatigue_onset
    from .yawn_detector import detect_yawn, get_MAR, get_yawn_frequency
except ImportError:
    from alerts.alert_manager import AlertManager
    from core.constants import EAR_THRESHOLD_DEFAULT, FRAME_RATE, MAR_THRESHOLD_DEFAULT
    from core.distraction import DistractionDetector, get_gaze_direction
    from core.explainer import generate_explanation
    from core.eye_tracker import average_ear, detect_prolonged_closure, get_blink_rate, is_eye_closed
    from core.fatigue_scorer import classify_risk, compute_score
    from core.head_pose import classify_pose, detect_microsleep_nod, estimate_head_pose
    from core.predictor import predict_fatigue_onset
    from core.yawn_detector import detect_yawn, get_MAR, get_yawn_frequency
    from utils.logger import get_logger

logger = get_logger(__name__)

_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_FACE_MODEL = os.path.abspath(os.path.join(_MODELS_DIR, "face_landmarker.task"))


def _build_face_landmarker() -> FaceLandmarker | None:
    if not os.path.isfile(_FACE_MODEL):
        logger.error("face_landmarker.task not found at %s", _FACE_MODEL)
        return None
    try:
        # options = FaceLandmarkerOptions(
        #     base_options=BaseOptions(model_asset_path=_FACE_MODEL),
        #     running_mode=RunningMode.IMAGE,
        #     num_faces=1,
        #     output_face_blendshapes=False,
        #     output_facial_transformation_matrixes=False,
        # )
        options = FaceLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path=_FACE_MODEL,
        delegate=BaseOptions.Delegate.CPU,
    ),
    running_mode=RunningMode.IMAGE,
    num_faces=1,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
)
        return FaceLandmarker.create_from_options(options)
    except Exception as exc:
        logger.error("Failed to create FaceLandmarker: %s", exc)
        return None


class FatigueDetector:
    """Process frames sent by the frontend and return detection state dicts."""

    def __init__(self, user_calibration: dict | None = None):
        self.user_calibration = user_calibration or {}
        self.alert_manager = AlertManager()
        self._distraction = DistractionDetector()
        self._face_landmarker: FaceLandmarker | None = _build_face_landmarker()

        self.ear_history: deque = deque(maxlen=FRAME_RATE * 60)
        self.score_history: deque = deque(maxlen=600)
        self.pitch_history: deque = deque(maxlen=FRAME_RATE * 5)
        self.blink_history: list = []
        self.yawn_history: list = []
        self.was_eye_closed = False
        self.was_yawning = False
        self.yawn_count = 0

    def close(self) -> None:
        """Release all MediaPipe resources."""
        self._distraction.close()
        if self._face_landmarker is not None:
            self._face_landmarker.close()
            self._face_landmarker = None

    def process_frame_bytes(self, frame_bytes: bytes) -> dict:
        """Decode a JPEG frame and run the full detection pipeline on it."""
        # Decode JPEG bytes → numpy BGR array
        arr = np.frombuffer(frame_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None:
            return self._error_state("invalid_frame")
        return self._process_frame(frame)

    def process_b64_frame(self, b64_data: str) -> dict:
        """Decode a base64-encoded JPEG frame and run detection."""
        # Strip data-URL prefix if present: "data:image/jpeg;base64,..."
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        try:
            frame_bytes = base64.b64decode(b64_data)
        except Exception:
            return self._error_state("invalid_frame")
        return self.process_frame_bytes(frame_bytes)

    def _error_state(self, error_code: str) -> dict:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "ear": 0.0,
            "mar": 0.0,
            "head_pose": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0, "label": "unknown"},
            "gaze": "center",
            "blink_rate": 0.0,
            "yawn_count": self.yawn_count,
            "fatigue_score": 0.0,
            "risk_level": "Safe",
            "explanation": generate_explanation({}, "Safe"),
            "prediction": predict_fatigue_onset(list(self.score_history)),
            "alert": None,
            "face_detected": False,
            "phone_detected": False,
            "error": error_code,
        }

    def _process_frame(self, frame: np.ndarray) -> dict:
        """Run a single BGR frame through detection and scoring modules."""
        timestamp = datetime.utcnow()

        if self._face_landmarker is None:
            state = self._error_state("vision_unavailable")
            state["timestamp"] = timestamp.isoformat()
            return state

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self._face_landmarker.detect(mp_image)

        face_detected = len(result.face_landmarks) > 0
        phone_detected = self._distraction.detect_phone_usage(frame)
        face_absent = self._distraction.update_face_presence(face_detected)

        ear = 0.0
        mar = 0.0
        pose = {"pitch": 0.0, "yaw": 0.0, "roll": 0.0, "label": "unknown"}
        gaze = "center"

        if face_detected:
            landmarks = result.face_landmarks[0]
            ear = average_ear(landmarks)
            mar = get_MAR(landmarks)
            pose_angles = estimate_head_pose(landmarks, frame.shape)
            pose_label = classify_pose(**pose_angles)
            pose = {**pose_angles, "label": pose_label}
            gaze = get_gaze_direction(landmarks)
            self._update_events(timestamp, ear, mar)

        blink_rate = get_blink_rate(self.blink_history)
        yawn_freq = get_yawn_frequency(self.yawn_history)
        ear_threshold = self.user_calibration.get("ear_threshold", EAR_THRESHOLD_DEFAULT)

        # Only record EAR when a face is present — zeros would inflate eye-closure ratio
        if face_detected:
            self.ear_history.append((timestamp, ear))
        self.pitch_history.append((time.time(), pose["pitch"]))

        eye_closure_ratio = (
            sum(1 for _, s in self.ear_history if s < ear_threshold)
            / max(len(self.ear_history), 1)
        )
        head_deviation = max(abs(pose["pitch"]), abs(pose["yaw"]), abs(pose["roll"]))
        prolonged_closure = detect_prolonged_closure(
            list(self.ear_history), FRAME_RATE, threshold=ear_threshold
        )
        distraction = (
            phone_detected
            or face_absent
            or gaze in {"left", "right", "down"}
            or detect_microsleep_nod(list(self.pitch_history))
        )

        score, sub_scores = compute_score(
            eye_closure_ratio,
            blink_rate - self.user_calibration.get("blink_rate", 15.0),
            yawn_freq,
            head_deviation,
            distraction or prolonged_closure,
            self.user_calibration,
        )
        risk = classify_risk(score)
        self.score_history.append(score)
        explanation = generate_explanation(sub_scores, risk)
        alert = self.alert_manager.trigger_alert(risk, explanation)

        return {
            "timestamp": timestamp.isoformat(),
            "ear": round(ear, 4),
            "mar": round(mar, 4),
            "head_pose": {
                k: round(v, 2) if isinstance(v, float) else v
                for k, v in pose.items()
            },
            "gaze": gaze,
            "blink_rate": round(blink_rate, 2),
            "yawn_count": self.yawn_count,
            "fatigue_score": round(score, 3),
            "risk_level": risk,
            "explanation": explanation,
            "prediction": predict_fatigue_onset(list(self.score_history)),
            "alert": alert,
            "face_detected": face_detected and not face_absent,
            "phone_detected": phone_detected,
        }

    def _update_events(self, timestamp: datetime, ear: float, mar: float) -> None:
        ear_threshold = self.user_calibration.get("ear_threshold", EAR_THRESHOLD_DEFAULT)
        mar_threshold = self.user_calibration.get("mar_threshold", MAR_THRESHOLD_DEFAULT)
        closed = is_eye_closed(ear, ear_threshold)
        if self.was_eye_closed and not closed:
            self.blink_history.append(timestamp)
        self.was_eye_closed = closed
        yawning = detect_yawn(mar, mar_threshold)
        if yawning and not self.was_yawning:
            self.yawn_history.append(timestamp)
            self.yawn_count += 1
        self.was_yawning = yawning
