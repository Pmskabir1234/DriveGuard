import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Play, Square } from "lucide-react";
import AlertBanner from "../components/AlertBanner";
import ExplainPanel from "../components/ExplainPanel";
import FatigueGauge from "../components/FatigueGauge";
import HistoryChart from "../components/HistoryChart";
import StatsBar from "../components/StatsBar";
import VideoFeed from "../components/VideoFeed";
import { useSession } from "../hooks/useSession";
import { useWebSocket } from "../hooks/useWebSocket";

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/** Main real-time driver monitoring dashboard. */
export default function Dashboard({ userId, userName, onRiskChange }) {
  const session = useSession(userId);

  // videoRef is forwarded into VideoFeed so the WebSocket hook can capture
  // frames directly from the browser's live camera stream
  const videoRef = useRef(null);

  // Connect WebSocket immediately — the backend warms up while the user
  // positions themselves. Session state only controls DB recording.
  const { frameData, isConnected, error } = useWebSocket(userId, true, videoRef);

  const [history, setHistory] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    if (frameData?.risk_level) onRiskChange(frameData.risk_level);
    if (frameData && session.sessionActive) {
      setHistory((prev) =>
        [...prev, { elapsed: session.durationSeconds, score: frameData.fatigue_score || 0 }].slice(-300),
      );
      setSnapshots((prev) =>
        [...prev, { ...frameData, at: Date.now() }].filter((item) => Date.now() - item.at <= 31000),
      );
    }
  }, [frameData, onRiskChange, session.durationSeconds, session.sessionActive]);

  const previousData = useMemo(() => snapshots[0] || null, [snapshots]);

  return (
    <main className="page dashboard-page">
      {/* Top bar */}
      <header className="topbar">
        <div>
          <h1>Driver Monitor</h1>
          <p>
            <span className={`conn-dot ${isConnected ? "live" : "offline"}`} />
            {userName}
            &nbsp;·&nbsp;
            {formatTime(session.durationSeconds)}
            &nbsp;·&nbsp;
            {isConnected ? "Live" : "Offline"}
            {error ? ` · ${error}` : ""}
          </p>
        </div>
        <button
          className={session.sessionActive ? "danger-btn" : "primary-btn"}
          onClick={session.sessionActive ? session.endSession : session.startSession}
          style={{ display: "flex", alignItems: "center", gap: 7 }}
        >
          {session.sessionActive ? (
            <>
              <Square size={14} />
              Stop Session
            </>
          ) : (
            <>
              <Play size={14} />
              Start Session
            </>
          )}
        </button>
      </header>

      {/* Main grid: video + right rail */}
      <div className="dashboard-grid">
        <VideoFeed ref={videoRef} frameData={frameData} isConnected={isConnected} />
        <aside className="right-rail">
          <FatigueGauge
            score={frameData?.fatigue_score || 0}
            riskLevel={frameData?.risk_level || "Safe"}
          />
          <AlertBanner
            riskLevel={frameData?.risk_level || "Safe"}
            message={frameData?.alert}
          />
          <ExplainPanel explanation={frameData?.explanation} />
        </aside>
      </div>

      {/* Stats row */}
      <StatsBar
        frameData={frameData}
        durationSeconds={session.durationSeconds}
        previousData={previousData}
      />

      {/* Trend chart */}
      <HistoryChart data={history} />
    </main>
  );
}

Dashboard.propTypes = {
  userId: PropTypes.number.isRequired,
  userName: PropTypes.string.isRequired,
  onRiskChange: PropTypes.func.isRequired,
};
