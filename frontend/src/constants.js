export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
export const RISK_COLORS = {
  Safe: "#10b981",
  Moderate: "#f59e0b",
  High: "#ef4444",
};
export const RISK_THRESHOLDS = { safe: 0.35, high: 0.65 };
export const CALIBRATION_SECONDS = 30;

