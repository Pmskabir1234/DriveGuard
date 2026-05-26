"""Non-blocking alert sound and message manager."""

import os
import threading
import time
from pathlib import Path

try:
    from ..core.constants import ALERT_COOLDOWN_SECONDS
    from ..utils.logger import get_logger
except ImportError:
    from core.constants import ALERT_COOLDOWN_SECONDS
    from utils.logger import get_logger

logger = get_logger(__name__)


class AlertManager:
    """Trigger risk-level alerts with cooldown and daemon-thread playback."""

    def __init__(self, sound_dir: str | None = None):
        """Initialize alert cooldown state and optional pygame mixer."""
        self.last_alert_time: dict[str, float] = {}
        self.sound_dir = Path(sound_dir or Path(__file__).parent / "sounds")
        self.enabled = os.getenv("ALERT_SOUND_ENABLED", "true").lower() == "true"

    def trigger_alert(self, risk_level: str, explanation: dict) -> str | None:
        """Return and play the appropriate alert message for a risk level."""
        if risk_level == "Safe":
            return None
        now = time.time()
        if now - self.last_alert_time.get(risk_level, 0) < ALERT_COOLDOWN_SECONDS:
            return None
        self.last_alert_time[risk_level] = now
        if risk_level == "Moderate":
            self._play_sound("warning.mp3")
            return "Stay alert! Signs of drowsiness detected."
        self._play_sound("alarm.mp3")
        return "DANGER! Pull over immediately. High fatigue detected."

    def _play_sound(self, filename: str) -> None:
        """Play a sound file in a daemon thread without blocking detection."""
        if not self.enabled:
            return
        path = self.sound_dir / filename

        def worker() -> None:
            """Load pygame lazily and play an alert sound when possible."""
            try:
                import pygame

                if not pygame.mixer.get_init():
                    pygame.mixer.init()
                if path.exists() and path.stat().st_size > 0:
                    pygame.mixer.music.load(str(path))
                    pygame.mixer.music.play()
            except Exception as exc:
                logger.warning("Alert playback skipped: %s", exc)

        threading.Thread(target=worker, daemon=True).start()
