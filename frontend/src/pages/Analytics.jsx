import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { getDailyAnalytics, getSummaryAnalytics, getTrendAnalytics } from "../api/apiClient";
import { RISK_COLORS } from "../constants";

const RISK_RANK = { Safe: 0, Moderate: 1, High: 2 };

function RiskBadge({ level }) {
  return (
    <span className={`risk-badge ${level?.toLowerCase() || "safe"}`}>
      {level || "Safe"}
    </span>
  );
}
RiskBadge.propTypes = { level: PropTypes.string };

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(13,21,38,0.95)", border: "1px solid rgba(99,140,255,0.25)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#e8edf8" }}>
      <div style={{ color: "#7a8aaa", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>Avg score: {Math.round((payload[0]?.value || 0) * 100)}%</div>
    </div>
  );
}
CustomBarTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string };

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div style={{ background: "rgba(13,21,38,0.95)", border: "1px solid rgba(99,140,255,0.25)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#e8edf8" }}>
      <div style={{ fontWeight: 700, color: RISK_COLORS[entry.name] || "#e8edf8" }}>{entry.name}</div>
      <div>{entry.value} events</div>
    </div>
  );
}
CustomPieTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array };

/** Historical fatigue analytics page. */
export default function Analytics({ userId }) {
  const [daily, setDaily] = useState([]);
  const [trends, setTrends] = useState([]);
  const [summary, setSummary] = useState({ recent_sessions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDailyAnalytics(userId),
      getTrendAnalytics(userId),
      getSummaryAnalytics(userId),
    ])
      .then(([d, t, s]) => {
        setDaily(d);
        setTrends(t);
        setSummary(s);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const peakRisk = summary.peak_risk || "Safe";

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart3 size={22} style={{ opacity: 0.7 }} />
            Analytics
          </h1>
          <p>
            {summary.total_sessions || 0} sessions&nbsp;·&nbsp;Peak risk:&nbsp;
            <RiskBadge level={peakRisk} />
          </p>
        </div>
      </header>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", padding: "40px 0", textAlign: "center" }}>
          Loading analytics…
        </div>
      ) : (
        <>
          <div className="analytics-grid">
            {/* 7-day bar chart */}
            <section className="panel" style={{ padding: 20 }}>
              <h2>7-Day Average Score</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#4a5568" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "#4a5568" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="avg_score" radius={[4, 4, 0, 0]}>
                    {daily.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.avg_score >= 0.65
                            ? "#ef4444"
                            : entry.avg_score >= 0.35
                            ? "#f59e0b"
                            : "#10b981"
                        }
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Risk distribution pie */}
            <section className="panel" style={{ padding: 20 }}>
              <h2>Risk Distribution</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={trends}
                    dataKey="count"
                    nameKey="risk_level"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${Math.round(percent * 100)}%`
                    }
                    labelLine={false}
                  >
                    {trends.map((entry) => (
                      <Cell
                        key={entry.risk_level}
                        fill={RISK_COLORS[entry.risk_level] || "#64748b"}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </section>
          </div>

          {/* Sessions table */}
          <section className="panel" style={{ padding: 20 }}>
            <h2>Last 10 Sessions</h2>
            {(summary.recent_sessions || []).length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>No sessions recorded yet.</p>
            ) : (
              <div className="table-container">
                <table className="session-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Peak Risk</th>
                      <th>Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.recent_sessions || []).map((row) => (
                      <tr key={row.id}>
                        <td>{new Date(row.date).toLocaleString()}</td>
                        <td>{row.duration_seconds}s</td>
                        <td>
                          <RiskBadge level={row.peak_risk} />
                        </td>
                        <td
                          style={{
                            color:
                              row.avg_score >= 0.65
                                ? "var(--high)"
                                : row.avg_score >= 0.35
                                ? "var(--moderate)"
                                : "var(--safe)",
                            fontWeight: 700,
                          }}
                        >
                          {Math.round(row.avg_score * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

Analytics.propTypes = {
  userId: PropTypes.number.isRequired,
};
