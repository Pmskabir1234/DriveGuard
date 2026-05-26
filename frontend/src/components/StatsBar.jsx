import PropTypes from "prop-types";
import { Activity, Clock, Eye, Wind } from "lucide-react";

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function TrendArrow({ now, before }) {
  if (now > before) return <span className="stat-trend up">↑</span>;
  if (now < before) return <span className="stat-trend down">↓</span>;
  return <span className="stat-trend flat">→</span>;
}

TrendArrow.propTypes = { now: PropTypes.number, before: PropTypes.number };

/** Renders current session statistics with trend indicators. */
export default function StatsBar({ frameData, durationSeconds, previousData }) {
  const score = frameData?.fatigue_score || 0;
  const blinkRate = frameData?.blink_rate || 0;
  const yawnCount = frameData?.yawn_count || 0;

  const cards = [
    {
      icon: <Eye size={16} />,
      label: "Blink Rate",
      value: blinkRate.toFixed(1),
      unit: "/min",
      trend: <TrendArrow now={blinkRate} before={previousData?.blink_rate || 0} />,
    },
    {
      icon: <Wind size={16} />,
      label: "Yawn Count",
      value: yawnCount,
      unit: "",
      trend: <TrendArrow now={yawnCount} before={previousData?.yawn_count || 0} />,
    },
    {
      icon: <Activity size={16} />,
      label: "Fatigue Score",
      value: `${Math.round(score * 100)}`,
      unit: "%",
      trend: <TrendArrow now={score} before={previousData?.fatigue_score || 0} />,
    },
    {
      icon: <Clock size={16} />,
      label: "Duration",
      value: formatTime(durationSeconds),
      unit: "",
      trend: null,
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div className="stat-card" key={card.label}>
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {card.icon}
            {card.label}
          </div>
          <div className="stat-value">
            {card.value}
            {card.unit && (
              <span style={{ fontSize: "0.45em", fontWeight: 600, opacity: 0.6, marginLeft: 2 }}>
                {card.unit}
              </span>
            )}
          </div>
          {card.trend}
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
