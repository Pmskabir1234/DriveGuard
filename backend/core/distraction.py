"""Face absence, phone-use, and gaze direction detection.

All state is encapsulated in DistractionDetector so that multiple concurrent
WebSocket connections (multiple users) never share mutable module-level globals.

Uses the MediaPipe Tasks API (mediapipe >= 0.10) — mp.solutions is not used.

Design note: face detection is performed ONCE per frame by the main FatigueDetector
and the result is passed into update_face_presence() here.  This avoids running a
second FaceLandmarker on every frame (which would double CPU usage and cause
camera-access conflicts on Windows).
"""

import os
import time

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision
from mediapipe.tasks.python.vision import (
    HandLandmarker,
    HandLandmarkerOptions,
    RunningMode,
)

try:
    from .constants import LEFT_IRIS, RIGHT_IRIS
    from ..utils.landmark_utils import landmark_to_xy
except ImportError:
    from core.constants import LEFT_IRIS, RIGHT_IRIS
    from utils.landmark_utils import landmark_to_xy

# Resolve model paths relative to this file
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_HAND_MODEL = os.path.abspath(os.path.join(_MODELS_DIR, "hand_landmarker.task"))

# Seconds without a face before we flag face_absent
_FACE_ABSENT_TIMEOUT = 2.0


class DistractionDetector:
    """Per-connection detector for face absence, phone use, and gaze direction."""

    def __init__(self):
        # Timestamp of the last frame where a face was present
        self._last_face_seen: float = time.time()
        self._hand_landmarker: HandLandmarker | None = None

    # ------------------------------------------------------------------
    # Lazy initializer
    # ------------------------------------------------------------------

    def _get_hand_landmarker(self) -> HandLandmarker | None:
        """Return a lazily initialized HandLandmarker instance or None."""
        if self._hand_landmarker is not None:
            return self._hand_landmarker
        if not os.path.isfile(_HAND_MODEL):
            return None
        try:
            options = HandLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=_HAND_MODEL),
                running_mode=RunningMode.IMAGE,
                num_hands=2,
                min_hand_detection_confidence=0.45,
            )
            self._hand_landmarker = HandLandmarker.create_from_options(options)
        except Exception:
            self._hand_landmarker = None
        return self._hand_landmarker

    # ------------------------------------------------------------------
    # Detection methods
    # ------------------------------------------------------------------

    def update_face_presence(self, face_detected: bool) -> bool:
        """Update face-presence tracking and return True if face has been absent > 2 s.

        Call this once per frame with the face_detected result from the main
        FatigueDetector — no separate face detection pass needed here.
        """
        if face_detected:
            self._last_face_seen = time.time()
            return False
        return (time.time() - self._last_face_seen) > _FACE_ABSENT_TIMEOUT

    def detect_phone_usage(self, frame) -> bool:
        """Return True when hands appear in the upper face area, a phone-use proxy."""
        landmarker = self._get_hand_landmarker()
        if landmarker is None:
            return False
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        try:
            result = landmarker.detect(mp_image)
        except Exception:
            return False
        if not result.hand_landmarks:
            return False
        for hand in result.hand_landmarks:
            xs = [lm.x * w for lm in hand]
            ys = [lm.y * h for lm in hand]
            if min(ys) < h * 0.4 and w * 0.2 < float(np.mean(xs)) < w * 0.8:
                return True
        return False

    def close(self) -> None:
        """Release MediaPipe resources."""
        if self._hand_landmarker is not None:
            self._hand_landmarker.close()
            self._hand_landmarker = None


def get_gaze_direction(landmarks) -> str:
    """Estimate gaze direction from iris centers relative to eye corners.

    landmarks is a flat list of NormalizedLandmark objects (Tasks API format).
    Iris indices 468-477 are included in the face_landmarker model output.
    Falls back to 'center' gracefully if iris landmarks are absent.
    """
    try:
        if len(landmarks) <= max(max(LEFT_IRIS), max(RIGHT_IRIS)):
            return "center"
        left = np.mean([landmark_to_xy(landmarks, idx) for idx in LEFT_IRIS], axis=0)
        right = np.mean([landmark_to_xy(landmarks, idx) for idx in RIGHT_IRIS], axis=0)
        iris_x = float((left[0] + right[0]) / 2)
        iris_y = float((left[1] + right[1]) / 2)
        if iris_y > 0.58:
            return "down"
        if iris_x < 0.43:
            return "left"
        if iris_x > 0.57:
            return "right"
        return "center"
    except Exception:
        return "center"
