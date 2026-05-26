"""Explainable AI factor attribution for fatigue risk."""

try:
    from .constants import WEIGHTS
except ImportError:
    from core.constants import WEIGHTS

FACTOR_LABELS = {
    "eye_closure": "Eye closure duration",
    "blink_rate_anomaly": "Blink rate anomaly",
    "yawn_frequency": "Yawning frequency",
    "head_pose_deviation": "Head pose deviation",
    "distraction": "Driver distraction",
}


def _severity(pct: int) -> str:
    """Return a human-readable severity label for a contribution percentage."""
    if pct >= 35:
        return "critical"
    if pct >= 20:
        return "high"
    if pct >= 10:
        return "moderate"
    return "low"


def generate_explanation(sub_scores: dict, risk_level: str) -> dict:
    """Return factor contribution percentages and a recommendation for the driver."""
    weighted = {key: float(sub_scores.get(key, 0.0)) * WEIGHTS[key] for key in WEIGHTS}
    total = sum(weighted.values())
    factors = []
    if total > 0:
        for key, value in sorted(weighted.items(), key=lambda item: item[1], reverse=True):
            pct = int(round((value / total) * 100))
            if pct > 5:
                factors.append({"factor": FACTOR_LABELS[key], "contribution_pct": pct, "severity": _severity(pct)})
    recommendations = {
        "Safe": "Continue driving attentively and maintain regular breaks.",
        "Moderate": "Stay alert, improve posture, and consider a short rest soon.",
        "High": "Pull over safely and take a 15-minute break.",
    }
    return {
        "risk_level": risk_level,
        "total_score": round(total, 3),
        "contributing_factors": factors,
        "recommendation": recommendations.get(risk_level, recommendations["Safe"]),
    }
