"""Trend-based early fatigue prediction."""

import numpy as np


def predict_fatigue_onset(score_history: list[float], window: int = 30) -> dict:
    """Predict whether fatigue score is trending toward high risk."""
    if len(score_history) < 3:
        return {"trend": "stable", "predicted_high_risk_in_seconds": None, "confidence": 0.0}
    samples = np.array(score_history[-window:], dtype=float)
    x_values = np.arange(len(samples), dtype=float)
    slope, intercept = np.polyfit(x_values, samples, 1)
    trend = "rising" if slope > 0.003 else "falling" if slope < -0.003 else "stable"
    predicted = None
    if slope > 0.01 and samples[-1] < 0.65:
        predicted = max(0, int((0.65 - samples[-1]) / slope))
    confidence = min(1.0, abs(float(slope)) * 50)
    return {"trend": trend, "predicted_high_risk_in_seconds": predicted, "confidence": round(confidence, 2)}

