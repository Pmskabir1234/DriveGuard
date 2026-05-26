import { useState } from "react";
import PropTypes from "prop-types";
import { Settings as SettingsIcon } from "lucide-react";
import CalibrationModal from "../components/CalibrationModal";
import { useWebSocket } from "../hooks/useWebSocket";

/** User preferences and calibration page. */
export default function Settings({ userId, setUserId, userName, setUserName }) {
  // Only open the WebSocket stream when calibration is actively running.
  // This prevents a second concurrent camera grab while the Dashboard is live.
  const [calibrating, setCalibrating] = useState(false);
  const { frameData, isConnected } = useWebSocket(userId, calibrating);

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SettingsIcon size={22} style={{ opacity: 0.7 }} />
            Settings
          </h1>
          <p>
            {calibrating
              ? isConnected
                ? "Calibration stream ready"
                : "Connecting to calibration stream…"
              : "Start calibration to open the live stream"}
          </p>
        </div>
      </header>

      <section className="panel settings-panel">
        <label>
          User ID
          <input
            type="number"
            min="1"
            value={userId}
            onChange={(event) => setUserId(Number(event.target.value || 1))}
          />
        </label>
        <label>
          Driver Name
          <input
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
          />
        </label>
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
