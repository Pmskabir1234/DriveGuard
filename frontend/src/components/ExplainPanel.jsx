import PropTypes from "prop-types";
import { Info } from "lucide-react";

/** Displays explainable AI fatigue factor contributions. */
export default function ExplainPanel({ explanation }) {
  const factors = explanation?.contributing_factors || [];

  return (
    <section className="panel explain-panel" style={{ padding: 24 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Info size={18} style={{ color: "var(--accent)" }} />
        Intelligence Report
      </h2>

      {factors.length === 0 ? (
        <p className="muted" style={{ fontSize: 14, fontWeight: 500 }}>
          System is monitoring normal behavioral patterns. No anomalies detected.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {factors.map((factor) => (
            <div className="factor-row" key={factor.factor} style={{ marginBottom: 0 }}>
              <div className="factor-head" style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{factor.factor}</span>
                <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{factor.contribution_pct}%</span>
              </div>
              <div className="bar-track" style={{ height: 8, background: "var(--bg-elevated)" }}>
                <div
                  className={`bar-fill ${factor.severity}`}
                  style={{ 
                    width: `${factor.contribution_pct}%`,
                    boxShadow: factor.severity === "high" || factor.severity === "critical" ? "0 0 12px var(--high-glow)" : "none"
                  }}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <span className={`severity ${factor.severity}`} style={{ fontSize: 10, padding: "2px 10px" }}>
                  {factor.severity} severity
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {explanation?.recommendation && (
        <div className="recommendation" style={{ 
          marginTop: 24, 
          paddingTop: 16, 
          borderTop: "1px solid var(--border)",
          color: "var(--text-secondary)",
          fontSize: 13,
          lineHeight: 1.5,
          fontWeight: 500,
          fontStyle: "normal"
        }}>
          <b style={{ color: "var(--text-primary)", display: "block", marginBottom: 4 }}>Action Required:</b>
          {explanation.recommendation}
        </div>
      )}
    </section>
  );
}

ExplainPanel.propTypes = {
  explanation: PropTypes.object,
};
