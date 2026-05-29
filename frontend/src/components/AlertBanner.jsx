import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, ShieldAlert } from "lucide-react";

/** Shows a persistent risk alert when moderate or high fatigue is detected. */
export default function AlertBanner({ riskLevel, message }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (riskLevel !== "Safe" && message) {
      setVisible(true);
      const timeout = window.setTimeout(() => setVisible(riskLevel !== "Safe"), 8000);
      return () => window.clearTimeout(timeout);
    }
    setVisible(false);
    return undefined;
  }, [message, riskLevel]);

  if (!visible) return null;

  const isHigh = riskLevel === "High";
  const Icon = isHigh ? ShieldAlert : AlertTriangle;

  return (
    <div
      className={`alert-banner ${isHigh ? "alert-high" : "alert-moderate"}`}
      style={{ 
        padding: "16px 20px", 
        borderRadius: 16, 
        border: "1px solid transparent",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        fontWeight: 600,
        fontSize: 14,
        backdropFilter: "blur(20px)"
      }}
      role="alert"
      aria-live="assertive"
    >
      <div style={{ 
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        background: "rgba(255,255,255,0.15)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexShrink: 0
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <b style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8, marginBottom: 2 }}>
          {isHigh ? "Critical Alert" : "Safety Warning"}
        </b>
        {message}
      </div>
    </div>
  );
}

AlertBanner.propTypes = {
  riskLevel: PropTypes.string,
  message: PropTypes.string,
};

AlertBanner.propTypes = {
  riskLevel: PropTypes.string,
  message: PropTypes.string,
};
