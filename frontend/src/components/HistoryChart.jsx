import PropTypes from "prop-types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div
      style={{
        background: "rgba(13, 21, 38, 0.95)",
        border: "1px solid rgba(99,140,255,0.25)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "#e8edf8",
      }}
    >
      <div style={{ color: "#7a8aaa", marginBottom: 2 }}>
        t = {payload[0]?.payload?.elapsed}s
      </div>
      <div style={{ fontWeight: 700 }}>
        Score:{" "}
        <span style={{ color: val >= 0.65 ? "#ef4444" : val >= 0.35 ? "#f59e0b" : "#10b981" }}>
          {Math.round(val * 100)}%
        </span>
      </div>
    </div>
  );
}

CustomTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array };

/** Rolling fatigue-score area chart for the active session. */
export default function HistoryChart({ data }) {
  return (
    <section className="panel history-panel">
      <h2 style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <TrendingUp size={15} style={{ opacity: 0.6 }} />
        Session Trend
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data.slice(-300)} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="elapsed"
            tick={{ fontSize: 10, fill: "#4a5568" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: "#4a5568" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0.35} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={0.65} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#scoreGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

HistoryChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
