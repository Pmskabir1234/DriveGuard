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
  const videoRef = useRef(null);
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
      <header className="topbar">
        <div className="topbar-bg-glow" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
          <div>
            <h1>Driver Monitor</h1>
            <p style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span className={`conn-dot ${isConnected ? "live" : "offline"}`} />
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{userName}</span>
              <span style={{ color: "var(--text-muted)" }}>•</span>
              <span style={{ fontFamily: "monospace", letterSpacing: 1, fontWeight: 600 }}>{formatTime(session.durationSeconds)}</span>
              <span style={{ color: "var(--text-muted)" }}>•</span>
              <span style={{ 
                color: isConnected ? "var(--safe)" : "var(--text-muted)", 
                fontWeight: 700, 
                textTransform: "uppercase", 
                fontSize: 11, 
                letterSpacing: 0.5 
              }}>
                {isConnected ? "System Live" : "System Offline"}
              </span>
              {error && <span style={{ color: "var(--high)", fontWeight: 600 }}>· {error}</span>}
            </p>
          </div>
          <button
            className={session.sessionActive ? "danger-btn" : "primary-btn"}
            onClick={session.sessionActive ? session.endSession : session.startSession}
            style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 16, height: 54, padding: "0 32px" }}
          >
            {session.sessionActive ? (
              <>
                <Square size={18} fill="currentColor" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                Start Monitoring
              </>
            )}
          </button>
        </div>
      </header>

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

      <StatsBar
        frameData={frameData}
        durationSeconds={session.durationSeconds}
        previousData={previousData}
      />

      <HistoryChart data={history} />
    </main>
  );
}

Dashboard.propTypes = {
  userId: PropTypes.number.isRequired,
  userName: PropTypes.string.isRequired,
  onRiskChange: PropTypes.func.isRequired,
};
