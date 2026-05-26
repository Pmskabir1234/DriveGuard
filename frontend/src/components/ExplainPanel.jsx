import PropTypes from "prop-types";
import { Info } from "lucide-react";

/** Displays explainable AI fatigue factor contributions. */
export default function ExplainPanel({ explanation }) {
  const factors = explanation?.contributing_factors || [];

  return (
    <section className="panel explain-panel">
      <h2 style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Info size={15} style={{ opacity: 0.6 }} />
        Why this risk level?
      </h2>

      {factors.length === 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          No significant fatigue factors detected.
        </p>
      )}

      {factors.map((factor) => (
        <div className="factor-row" key={factor.factor}>
          <div className="factor-head">
            <span>{factor.factor}</span>
            <b>{factor.contribution_pct}%</b>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${factor.severity}`}
              style={{ width: `${factor.contribution_pct}%` }}
            />
          </div>
          <span className={`severity ${factor.severity}`}>{factor.severity}</span>
        </div>
      ))}

      {explanation?.recommendation && (
        <p className="recommendation">{explanation.recommendation}</p>
      )}
    </section>
  );
}

ExplainPanel.propTypes = {
  explanation: PropTypes.object,
};
