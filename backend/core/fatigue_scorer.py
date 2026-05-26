"""Weighted fatigue risk scoring engine."""

try:
    from .constants import WEIGHTS
    from ..utils.landmark_utils import clamp
except ImportError:
    from core.constants import WEIGHTS
    from utils.landmark_utils import clamp


def compute_score(
    eye_closure_ratio: float,
    blink_anomaly: float,
    yawn_freq: float,
    head_deviation: float,
    distraction_flag: bool,
    user_calibration: dict,
) -> tuple[float, dict]:
    """Compute a normalized fatigue score and per-factor normalized sub-scores."""
    baseline = max(float(user_calibration.get("blink_rate", 15.0)), 1.0)
    sub_scores = {
        "eye_closure": clamp(eye_closure_ratio),
        "blink_rate_anomaly": clamp(abs(blink_anomaly) / baseline),
        "yawn_frequency": clamp(yawn_freq / 3.0),
        "head_pose_deviation": clamp(abs(head_deviation) / 45.0),
        "distraction": 1.0 if distraction_flag else 0.0,
    }
    score = sum(sub_scores[key] * WEIGHTS[key] for key in WEIGHTS)
    return clamp(score), sub_scores


def classify_risk(score: float) -> str:
    """Classify a fatigue score as Safe, Moderate, or High."""
    if score < 0.35:
        return "Safe"
    if score <= 0.65:
        return "Moderate"
    return "High"
