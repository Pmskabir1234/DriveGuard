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
    <div className="panel" style={{ padding: "12px 16px", border: "1px solid var(--border-bright)" }}>
      <div style={{ color: "var(--text-secondary)", marginBottom: 4, fontSize: 12, fontWeight: 500 }}>
        Elapsed: {payload[0]?.payload?.elapsed}s
      </div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>
        Fatigue:{" "}
        <span style={{ color: val >= 0.65 ? "var(--high)" : val >= 0.35 ? "var(--moderate)" : "var(--safe)" }}>
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
    <section className="panel history-panel" style={{ padding: 24 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <TrendingUp size={18} style={{ color: "var(--accent)" }} />
        Live Session Trend
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data.slice(-300)} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="var(--accent)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4F8CFF" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="elapsed"
            tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <ReferenceLine y={0.35} stroke="var(--moderate)" strokeDasharray="6 6" strokeOpacity={0.4} />
          <ReferenceLine y={0.65} stroke="var(--high)" strokeDasharray="6 6" strokeOpacity={0.4} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="url(#lineGrad)"
            strokeWidth={3}
            fill="url(#scoreGrad)"
            dot={false}
            isAnimationActive={true}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

HistoryChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
