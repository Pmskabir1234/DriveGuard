"""Personalized driver baseline calibration."""

from statistics import mean, pstdev


def run_calibration(
    ear_samples: list[float],
    mar_samples: list[float],
    blink_events: list,
    duration_seconds: int = 30,
) -> dict:
    """Compute baseline EAR, MAR, blink-rate, and thresholds from calibration samples."""
    baseline_ear = mean(ear_samples) if ear_samples else 0.33
    mar_mean = mean(mar_samples) if mar_samples else 0.35
    mar_std = pstdev(mar_samples) if len(mar_samples) > 1 else 0.12
    baseline_blink_rate = len(blink_events) / max(duration_seconds / 60, 0.1)
    return {
        "baseline_ear": round(baseline_ear, 4),
        "ear_threshold": round(baseline_ear * 0.75, 4),
        "baseline_blink_rate": round(baseline_blink_rate, 2),
        "mar_threshold": round(mar_mean + 2 * mar_std, 4),
    }

