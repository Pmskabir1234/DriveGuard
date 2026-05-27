# Smart Driver Fatigue & Drowsiness Detection System

A real-time AI-powered driver monitoring system for hackathon demos. It analyzes webcam frames, estimates eye closure, yawning, head pose, gaze, phone-use proxy signals, computes a fatigue risk score, streams live state to React, stores session history in SQLite, and explains why alerts were triggered.

## Architecture

```text
Webcam
  |
  v
OpenCV + MediaPipe FaceMesh/Hands
  |
  +--> EAR / blink rate
  +--> MAR / yawn frequency
  +--> head pose + gaze
  +--> distraction signals
  |
  v
Weighted Fatigue Scorer --> XAI Explainer --> Predictor --> Alert Manager
  |
  +--> FastAPI WebSocket /ws/stream
  +--> SQLite via SQLAlchemy
  |
  v
React Dashboard + Analytics + Calibration
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- Webcam access
- Optional: Docker Desktop

## Local Setup

Backend:

```bash
cd fatigue-detection/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd fatigue-detection/frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Docker Setup

```bash
cd fatigue-detection
docker compose up --build
```

Webcam access from Docker depends on the host OS. For the smoothest hackathon demo, run the backend locally when camera passthrough is unavailable.

## Calibration

1. Start the backend and frontend.
2. Open `Settings`.
3. Confirm `User ID`.
4. Click `Start Calibration`.
5. Look straight at the camera and stay alert for 30 seconds.
6. Save the computed blink rate, EAR threshold, and MAR threshold.

The saved values are stored on the `User` row and applied to the next WebSocket scoring loop.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health check |
| WS | `/ws/stream?user_id=1` | Real-time detector stream |
| POST | `/sessions/start` | Start a monitoring session |
| POST | `/sessions/{id}/end` | End and summarize a session |
| GET | `/sessions/{id}` | Get session details |
| POST | `/events` | Manually log a fatigue event |
| GET | `/sessions/{id}/events` | List session events |
| GET | `/events/recent?user_id=1&limit=20` | Recent fatigue events |
| POST | `/calibration/start?user_id=1` | Begin calibration flow |
| POST | `/calibration/compute` | Compute calibration from samples |
| POST | `/calibration/save` | Save calibration to user |
| GET | `/analytics/daily?user_id=1` | Last 7 days average score |
| GET | `/analytics/trends?user_id=1` | Risk frequency breakdown |
| GET | `/analytics/summary?user_id=1` | Session summary and recent sessions |

## Features

- [x] Real-time webcam analysis
- [x] Eye Aspect Ratio drowsiness detection
- [x] Blink rate anomaly monitoring
- [x] Mouth Aspect Ratio yawn detection
- [x] Head pose estimation
- [x] Gaze direction estimation
- [x] Phone-use proxy detection with MediaPipe Hands
- [x] Face absence detection
- [x] Weighted fatigue risk score
- [x] Explainable AI factor breakdown
- [x] Fatigue onset trend prediction
- [x] Voice/alarm alert manager with cooldown
- [x] SQLite session and event persistence
- [x] React dashboard with live gauge, video, stats, and chart
- [x] Historical analytics page
- [x] Personalized calibration UI
- [x] Docker Compose setup

## Demo Screenshots

Add screenshots here after running the local demo:

- Dashboard live monitoring
- High-risk alert state
- Analytics page
- Calibration results

## Team / Hackathon Info

- Team: Nova
- Members: Titli Bhowmick ▫️ Saad Kabir
- Event: Ideatex (GDG HITK)
- Demo link: https://drie-guard-ideatex.vercel.app/

## Known Demo Notes

- Phone detection is implemented as a lightweight hand-near-face proxy to avoid requiring a large object-detection model during setup.
- Sound playback is non-blocking and gracefully skips when no audio device is available.
- Docker webcam passthrough varies by platform; local backend execution is recommended for live camera demos.

