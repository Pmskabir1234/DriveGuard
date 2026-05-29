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
    <div className="panel" style={{ padding: "12px 16px", fontSize: 13, border: "1px solid var(--border-bright)" }}>
      <div style={{ color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>Avg score: {Math.round((payload[0]?.value || 0) * 100)}%</div>
    </div>
  );
}
CustomBarTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string };

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="panel" style={{ padding: "12px 16px", fontSize: 13, border: "1px solid var(--border-bright)" }}>
      <div style={{ fontWeight: 700, color: RISK_COLORS[entry.name] || "var(--text-primary)", fontSize: 15 }}>{entry.name}</div>
      <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{entry.value} events</div>
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
        <div className="topbar-bg-glow" />
        <div>
          <h1>Analytics</h1>
          <p>
            {summary.total_sessions || 0} sessions recorded&nbsp;·&nbsp;Peak risk:&nbsp;
            <RiskBadge level={peakRisk} />
          </p>
        </div>
      </header>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", padding: "100px 0", textAlign: "center", fontSize: 18, fontWeight: 500 }}>
          Analyzing data patterns…
        </div>
      ) : (
        <>
          <div className="analytics-grid">
            {/* 7-day bar chart */}
            <section className="panel" style={{ padding: 32 }}>
              <h2>7-Day Performance</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={daily} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: "var(--text-secondary)", fontWeight: 500 }} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    tick={{ fontSize: 12, fill: "var(--text-secondary)", fontWeight: 500 }} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `${Math.round(v * 100)}%`} 
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="avg_score" barSize={32} radius={[8, 8, 8, 8]}>
                    {daily.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.avg_score >= 0.65
                            ? "var(--high)"
                            : entry.avg_score >= 0.35
                            ? "var(--moderate)"
                            : "var(--safe)"
                        }
                        fillOpacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Risk distribution pie */}
            <section className="panel" style={{ padding: 32 }}>
              <h2>Risk Profile</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={trends}
                    dataKey="count"
                    nameKey="risk_level"
                    outerRadius={100}
                    innerRadius={70}
                    paddingAngle={8}
                    stroke="none"
                  >
                    {trends.map((entry) => (
                      <Cell
                        key={entry.risk_level}
                        fill={RISK_COLORS[entry.risk_level] || "var(--text-muted)"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
                {trends.map(t => (
                  <div key={t.risk_level} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: RISK_COLORS[t.risk_level] }} />
                    {t.risk_level}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sessions table */}
          <section className="panel">
            <div style={{ padding: "32px 32px 8px" }}>
              <h2>Recent Activity</h2>
            </div>
            {(summary.recent_sessions || []).length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <p className="muted">No session data available yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="session-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Duration</th>
                      <th>Peak Risk</th>
                      <th>Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.recent_sessions || []).map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{new Date(row.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{Math.floor(row.duration_seconds / 60)}m {row.duration_seconds % 60}s</td>
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
                            fontSize: 16
                          }}
                        >
                          {Math.round((1 - row.avg_score) * 100)}%
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
