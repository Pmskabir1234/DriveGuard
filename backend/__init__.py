"""Smart Driver Fatigue Detection System Backend.

The backend is intentionally runnable in two common ways:

- From this directory: ``uvicorn main:app``
- From the project root: ``uvicorn backend.main:app``

Most modules use absolute local imports such as ``import models`` and
``from core.detector import FatigueDetector`` so the first command stays simple
for Docker and local demos. When Python imports this package as ``backend``,
the package directory is added to ``sys.path`` so those same imports still
resolve without duplicating every import path.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
backend_path = str(BACKEND_DIR)

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
