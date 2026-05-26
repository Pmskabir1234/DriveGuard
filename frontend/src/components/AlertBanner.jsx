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
      role="alert"
      aria-live="assertive"
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
}

AlertBanner.propTypes = {
  riskLevel: PropTypes.string,
  message: PropTypes.string,
};
