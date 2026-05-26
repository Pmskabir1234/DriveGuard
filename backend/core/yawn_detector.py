"""Mouth aspect ratio and yawn frequency detection."""

from datetime import datetime, timedelta
from statistics import mean

try:
    from .constants import MAR_THRESHOLD_DEFAULT, MOUTH
    from ..utils.landmark_utils import euclidean_distance, landmark_to_xy
except ImportError:
    from core.constants import MAR_THRESHOLD_DEFAULT, MOUTH
    from utils.landmark_utils import euclidean_distance, landmark_to_xy


def get_MAR(landmarks, mouth_indices: list[int] = MOUTH) -> float:
    """Compute Mouth Aspect Ratio from outer lip MediaPipe landmarks."""
    pts = [landmark_to_xy(landmarks, idx) for idx in mouth_indices]
    horizontal = euclidean_distance(pts[0], pts[1])
    verticals = [
        euclidean_distance(pts[2], pts[6]),
        euclidean_distance(pts[3], pts[7]),
        euclidean_distance(pts[4], pts[5]),
    ]
    if horizontal == 0:
        return 0.0
    return float(mean(verticals) / horizontal)


def detect_yawn(mar: float, threshold: float = MAR_THRESHOLD_DEFAULT) -> bool:
    """Return True when MAR exceeds the calibrated yawn threshold."""
    return mar > threshold


def get_yawn_frequency(yawn_history: list[datetime], window_minutes: int = 5) -> float:
    """Return yawns per minute from timestamped yawn events."""
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    recent = [ts for ts in yawn_history if ts >= cutoff]
    return float(len(recent) / window_minutes)
