"""Shared constants for detection, scoring, and configuration."""

import os

LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
MOUTH = [61, 291, 39, 181, 0, 17, 269, 405]
LEFT_IRIS = [468, 469, 470, 471, 472]
RIGHT_IRIS = [473, 474, 475, 476, 477]

POSE_LANDMARKS = {
    "nose_tip": 1,
    "chin": 152,
    "left_eye_corner": 263,
    "right_eye_corner": 33,
    "left_mouth": 291,
    "right_mouth": 61,
}

WEIGHTS = {
    "eye_closure": 0.35,
    "blink_rate_anomaly": 0.15,
    "yawn_frequency": 0.20,
    "head_pose_deviation": 0.15,
    "distraction": 0.15,
}

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fatigue.db")
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
FRAME_RATE = int(os.getenv("FRAME_RATE", "10"))
EAR_THRESHOLD_DEFAULT = float(os.getenv("EAR_THRESHOLD_DEFAULT", "0.25"))
MAR_THRESHOLD_DEFAULT = float(os.getenv("MAR_THRESHOLD_DEFAULT", "0.60"))
ALERT_COOLDOWN_SECONDS = int(os.getenv("ALERT_COOLDOWN_SECONDS", "10"))

