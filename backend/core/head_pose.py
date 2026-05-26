"""Head pose estimation and nod detection."""

from collections.abc import Sequence

import cv2
import numpy as np

try:
    from .constants import POSE_LANDMARKS
    from ..utils.landmark_utils import landmark_to_xy
except ImportError:
    from core.constants import POSE_LANDMARKS
    from utils.landmark_utils import landmark_to_xy


def estimate_head_pose(landmarks: Sequence, image_shape: tuple[int, int, int]) -> dict:
    """Estimate pitch, yaw, and roll in degrees from six face landmarks."""
    h, w = image_shape[:2]
    image_points = np.array(
        [
            landmark_to_xy(landmarks, POSE_LANDMARKS["nose_tip"], image_shape),
            landmark_to_xy(landmarks, POSE_LANDMARKS["chin"], image_shape),
            landmark_to_xy(landmarks, POSE_LANDMARKS["left_eye_corner"], image_shape),
            landmark_to_xy(landmarks, POSE_LANDMARKS["right_eye_corner"], image_shape),
            landmark_to_xy(landmarks, POSE_LANDMARKS["left_mouth"], image_shape),
            landmark_to_xy(landmarks, POSE_LANDMARKS["right_mouth"], image_shape),
        ],
        dtype=np.float64,
    )
    model_points = np.array(
        [
            (0.0, 0.0, 0.0),
            (0.0, -63.6, -12.5),
            (-43.3, 32.7, -26.0),
            (43.3, 32.7, -26.0),
            (-28.9, -28.9, -24.1),
            (28.9, -28.9, -24.1),
        ],
        dtype=np.float64,
    )
    focal_length = w
    camera_matrix = np.array([[focal_length, 0, w / 2], [0, focal_length, h / 2], [0, 0, 1]], dtype=np.float64)
    dist_coeffs = np.zeros((4, 1))
    ok, rotation_vec, _ = cv2.solvePnP(model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return {"pitch": 0.0, "yaw": 0.0, "roll": 0.0}
    rotation_matrix, _ = cv2.Rodrigues(rotation_vec)
    angles, *_ = cv2.RQDecomp3x3(rotation_matrix)
    return {"pitch": float(angles[0]), "yaw": float(angles[1]), "roll": float(angles[2])}


def classify_pose(pitch: float, yaw: float, roll: float) -> str:
    """Classify driver head pose as forward, looking away, nodding, or tilting."""
    if abs(yaw) > 25:
        return "looking_away"
    if pitch > 20:
        return "nodding"
    if abs(roll) > 18:
        return "tilting"
    return "forward"


def detect_microsleep_nod(pitch_history: list[tuple[float, float]]) -> bool:
    """Detect a rapid pitch increase within roughly half a second."""
    if len(pitch_history) < 2:
        return False
    latest_time, latest_pitch = pitch_history[-1]
    recent = [(ts, pitch) for ts, pitch in pitch_history if latest_time - ts <= 0.5]
    return bool(recent and latest_pitch - min(pitch for _, pitch in recent) > 20)
