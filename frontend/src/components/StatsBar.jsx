import PropTypes from "prop-types";
import { Activity, Clock, Eye, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function TrendIndicator({ now, before }) {
  if (now > before) return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--high)", fontSize: 12, fontWeight: 700 }}>
      <TrendingUp size={14} />
      <span>+{(Math.abs(now - before) * (now < 1 ? 100 : 1)).toFixed(0)}{now < 1 ? "%" : ""}</span>
    </div>
  );
  if (now < before) return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--safe)", fontSize: 12, fontWeight: 700 }}>
      <TrendingDown size={14} />
      <span>-{(Math.abs(now - before) * (now < 1 ? 100 : 1)).toFixed(0)}{now < 1 ? "%" : ""}</span>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>
      <Minus size={14} />
      <span>0%</span>
    </div>
  );
}

TrendIndicator.propTypes = { now: PropTypes.number, before: PropTypes.number };

/** Renders current session statistics with trend indicators. */
export default function StatsBar({ frameData, durationSeconds, previousData }) {
  const score = frameData?.fatigue_score || 0;
  const blinkRate = frameData?.blink_rate || 0;
  const yawnCount = frameData?.yawn_count || 0;

  const cards = [
    {
      icon: <Eye size={18} />,
      label: "Blink Rate",
      value: blinkRate.toFixed(1),
      unit: "/min",
      trend: <TrendIndicator now={blinkRate} before={previousData?.blink_rate || 0} />,
    },
    {
      icon: <Wind size={18} />,
      label: "Yawn Count",
      value: yawnCount,
      unit: "total",
      trend: <TrendIndicator now={yawnCount} before={previousData?.yawn_count || 0} />,
    },
    {
      icon: <Activity size={18} />,
      label: "Fatigue Score",
      value: `${Math.round(score * 100)}`,
      unit: "%",
      trend: <TrendIndicator now={score} before={previousData?.fatigue_score || 0} />,
    },
    {
      icon: <Clock size={18} />,
      label: "Duration",
      value: formatTime(durationSeconds),
      unit: "elapsed",
      trend: null,
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div className="panel stat-card" key={card.label}>
          <div className="stat-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: "var(--accent)" }}>{card.icon}</div>
              {card.label}
            </div>
            {card.trend}
          </div>
          <div className="stat-value">
            {card.value}
            {card.unit && (
              <span style={{ fontSize: "0.45em", fontWeight: 600, color: "var(--text-muted)", marginLeft: 8, textTransform: "lowercase" }}>
                {card.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

StatsBar.propTypes = {
  frameData: PropTypes.object,
  durationSeconds: PropTypes.number.isRequired,
  previousData: PropTypes.object,
};
