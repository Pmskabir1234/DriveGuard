"""MediaPipe landmark helper functions."""

from math import sqrt
from typing import Iterable, Sequence

import numpy as np


def landmark_to_xy(landmarks: Sequence, index: int, image_shape: tuple[int, int, int] | None = None) -> np.ndarray:
    """Return a landmark as a 2D point, optionally scaled to image pixels."""
    point = landmarks[index]
    if image_shape:
        height, width = image_shape[:2]
        return np.array([point.x * width, point.y * height], dtype=np.float32)
    return np.array([point.x, point.y], dtype=np.float32)


def landmark_to_xyz(landmarks: Sequence, index: int, image_shape: tuple[int, int, int]) -> np.ndarray:
    """Return a landmark as a 3D image-space point."""
    point = landmarks[index]
    height, width = image_shape[:2]
    return np.array([point.x * width, point.y * height, point.z * width], dtype=np.float32)


def euclidean_distance(a: Iterable[float], b: Iterable[float]) -> float:
    """Return the Euclidean distance between two 2D or 3D points."""
    ax, ay, *az = a
    bx, by, *bz = b
    dz = (az[0] if az else 0.0) - (bz[0] if bz else 0.0)
    return float(sqrt((ax - bx) ** 2 + (ay - by) ** 2 + dz**2))


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    """Clamp a numeric value into an inclusive range."""
    return max(lower, min(upper, float(value)))

