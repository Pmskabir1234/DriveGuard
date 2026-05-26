"""Eye aspect ratio, blink-rate, and prolonged closure detection."""

from collections.abc import Sequence
from datetime import datetime, timedelta

try:
    from .constants import EAR_THRESHOLD_DEFAULT, LEFT_EYE, RIGHT_EYE
    from ..utils.landmark_utils import euclidean_distance, landmark_to_xy
except ImportError:
    from core.constants import EAR_THRESHOLD_DEFAULT, LEFT_EYE, RIGHT_EYE
    from utils.landmark_utils import euclidean_distance, landmark_to_xy


def get_EAR(landmarks: Sequence, eye_indices: list[int]) -> float:
    """Compute Eye Aspect Ratio from six MediaPipe eye landmarks."""
    points = [landmark_to_xy(landmarks, idx) for idx in eye_indices]
    vertical_1 = euclidean_distance(points[1], points[5])
    vertical_2 = euclidean_distance(points[2], points[4])
    horizontal = euclidean_distance(points[0], points[3])
    if horizontal == 0:
        return 0.0
    return float((vertical_1 + vertical_2) / (2.0 * horizontal))


def average_ear(landmarks: Sequence) -> float:
    """Return the average EAR for both eyes."""
    return (get_EAR(landmarks, LEFT_EYE) + get_EAR(landmarks, RIGHT_EYE)) / 2.0


def is_eye_closed(ear: float, threshold: float = EAR_THRESHOLD_DEFAULT) -> bool:
    """Return True when EAR is below the calibrated closed-eye threshold."""
    return ear < threshold


def get_blink_rate(blink_history: list[datetime], window_seconds: int = 60) -> float:
    """Return blinks per minute from timestamped blink events in a time window."""
    cutoff = datetime.utcnow() - timedelta(seconds=window_seconds)
    recent = [ts for ts in blink_history if ts >= cutoff]
    return float(len(recent) * (60 / window_seconds))


def detect_prolonged_closure(
    ear_history: list[tuple[datetime, float]], fps: int, threshold_seconds: float = 2.0, threshold: float = EAR_THRESHOLD_DEFAULT
) -> bool:
    """Return True if recent EAR samples have stayed below threshold long enough."""
    if not ear_history:
        return False
    needed = max(1, int(fps * threshold_seconds))
    recent = ear_history[-needed:]
    return len(recent) >= needed and all(ear < threshold for _, ear in recent)
