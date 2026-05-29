import { useState } from "react";
import PropTypes from "prop-types";
import { Settings as SettingsIcon, User, Fingerprint } from "lucide-react";
import CalibrationModal from "../components/CalibrationModal";
import { useWebSocket } from "../hooks/useWebSocket";

/** User preferences and calibration page. */
export default function Settings({ userId, setUserId, userName, setUserName }) {
  const [calibrating, setCalibrating] = useState(false);
  const { frameData, isConnected } = useWebSocket(userId, calibrating);

  return (
    <main className="page">
      <header className="topbar">
        <div className="topbar-bg-glow" />
        <div>
          <h1>Settings</h1>
          <p style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={`conn-dot ${isConnected ? "live" : "offline"}`} />
            {calibrating
              ? isConnected
                ? "Secure calibration stream active"
                : "Establishing secure connection…"
              : "Identity and biometric preferences"}
          </p>
        </div>
      </header>

      <section className="panel settings-panel" style={{ padding: 32, gap: 32 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <Fingerprint size={18} style={{ color: "var(--accent)" }} />
            Internal User ID
          </label>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Unique identifier for biometric data synchronization.</p>
          <input
            type="number"
            min="1"
            value={userId}
            onChange={(event) => setUserId(Number(event.target.value || 1))}
            style={{ height: 50, borderRadius: 12, fontSize: 16, fontWeight: 600 }}
          />
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={18} style={{ color: "var(--accent)" }} />
            Driver Profile Name
          </label>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>The name displayed during active monitoring sessions.</p>
          <input
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            style={{ height: 50, borderRadius: 12, fontSize: 16, fontWeight: 600 }}
            placeholder="Enter driver name..."
          />
        </div>
      </section>

      <CalibrationModal
        userId={userId}
        frameData={frameData}
        onCalibrationStart={() => setCalibrating(true)}
        onCalibrationEnd={() => setCalibrating(false)}
      />
    </main>
  );
}

Settings.propTypes = {
  userId: PropTypes.number.isRequired,
  setUserId: PropTypes.func.isRequired,
  userName: PropTypes.string.isRequired,
  setUserName: PropTypes.func.isRequired,
};
