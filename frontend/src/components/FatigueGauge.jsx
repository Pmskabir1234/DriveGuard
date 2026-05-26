import PropTypes from "prop-types";

const RISK_COLORS = {
  Safe:     "#10b981",
  Moderate: "#f59e0b",
  High:     "#ef4444",
};

/**
 * SVG semicircle gauge with a smooth animated needle.
 * The arc is drawn from -180° (left) to 0° (right) across the top half.
 */
export default function FatigueGauge({ score = 0, riskLevel = "Safe" }) {
  const percent = Math.round(Math.min(1, Math.max(0, score)) * 100);
  // Map 0–100% to -90° … +90° (needle sweeps 180°)
  const angle = -90 + percent * 1.8;
  const color = RISK_COLORS[riskLevel] || RISK_COLORS.Safe;

  // Needle tip coordinates (rotated around cx=120, cy=120)
  const rad = ((angle - 90) * Math.PI) / 180;
  const tipX = 120 + 72 * Math.cos(rad);
  const tipY = 120 + 72 * Math.sin(rad);

  return (
    <section className="panel gauge-panel">
      <svg viewBox="0 0 240 140" className="gauge" aria-label={`Fatigue score ${percent}%`}>
        {/* Background track */}
        <path
          d="M24 120 A96 96 0 0 1 216 120"
          className="gauge-track"
        />
        {/* Safe zone (0–35%) */}
        <path d="M24 120 A96 96 0 0 1 96 31" className="zone safe" />
        {/* Moderate zone (35–65%) */}
        <path d="M96 31 A96 96 0 0 1 168 34" className="zone moderate" />
        {/* High zone (65–100%) */}
        <path d="M168 34 A96 96 0 0 1 216 120" className="zone high" />

        {/* Needle */}
        <line
          x1="120"
          y1="120"
          x2={tipX}
          y2={tipY}
          className="needle"
          style={{ transform: "none" }}
        />
        {/* Needle pivot */}
        <circle cx="120" cy="120" r="8" className="needle-dot" />
        <circle cx="120" cy="120" r="3" fill={color} />
      </svg>

      <div className="gauge-text">
        <span className="gauge-score" style={{ color }}>
          {percent}
          <span style={{ fontSize: "0.45em", fontWeight: 700, opacity: 0.7 }}>%</span>
        </span>
        <span className="gauge-label" style={{ color }}>
          {riskLevel}
        </span>
      </div>
    </section>
  );
}

FatigueGauge.propTypes = {
  score: PropTypes.number,
  riskLevel: PropTypes.string,
};
