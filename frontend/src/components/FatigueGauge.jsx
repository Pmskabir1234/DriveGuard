import PropTypes from "prop-types";

const RISK_COLORS = {
  Safe:     "#10B981",
  Moderate: "#F59E0B",
  High:     "#EF4444",
};

/**
 * Premium SVG semicircle gauge with smooth animations and depth.
 */
export default function FatigueGauge({ score = 0, riskLevel = "Safe" }) {
  const percent = Math.round(Math.min(1, Math.max(0, score)) * 100);
  // Map 0–100% to -90° … +90°
  const angle = -90 + percent * 1.8;
  const color = RISK_COLORS[riskLevel] || RISK_COLORS.Safe;

  const rad = ((angle - 90) * Math.PI) / 180;
  const tipX = 120 + 80 * Math.cos(rad);
  const tipY = 120 + 80 * Math.sin(rad);

  return (
    <section className="panel gauge-panel" style={{ padding: "32px 24px" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 260, margin: "0 auto" }}>
        <svg viewBox="0 0 240 140" className="gauge" aria-label={`Fatigue score ${percent}%`}>
          <defs>
            <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background track */}
          <path
            d="M24 120 A96 96 0 0 1 216 120"
            stroke="var(--bg-elevated)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Active Progress */}
          <path
            d="M24 120 A96 96 0 0 1 216 120"
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="301.6"
            strokeDashoffset={301.6 - (percent / 100) * 301.6}
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1), stroke 400ms" }}
            filter="url(#gaugeShadow)"
          />

          {/* Needle */}
          <g style={{ transition: "all 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <line
              x1="120"
              y1="120"
              x2={tipX}
              y2={tipY}
              stroke="var(--text-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))" }}
            />
            <circle cx="120" cy="120" r="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="2" />
            <circle cx="120" cy="120" r="4" fill={color} style={{ transition: "fill 400ms" }} />
          </g>
        </svg>

        <div className="gauge-text" style={{ marginTop: -20 }}>
          <span className="gauge-score" style={{ color: "var(--text-primary)", fontSize: 48, fontWeight: 700 }}>
            {percent}
            <span style={{ fontSize: "0.4em", fontWeight: 600, color: "var(--text-muted)", marginLeft: 4 }}>%</span>
          </span>
          <div style={{ 
            marginTop: 4,
            padding: "4px 16px",
            background: `${color}15`,
            color: color,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            display: "inline-block"
          }}>
            {riskLevel} Risk
          </div>
        </div>
      </div>
    </section>
  );
}

FatigueGauge.propTypes = {
  score: PropTypes.number,
  riskLevel: PropTypes.string,
};
