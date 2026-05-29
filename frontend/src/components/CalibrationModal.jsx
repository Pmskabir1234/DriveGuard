import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { CheckCircle, Loader2, RefreshCw, Sparkles, ShieldCheck } from "lucide-react";
import { computeCalibration, saveCalibration, startCalibration } from "../api/apiClient";
import { CALIBRATION_SECONDS } from "../constants";

/** Runs the user calibration flow using live WebSocket frame samples. */
export default function CalibrationModal({
  userId,
  frameData,
  onSaved,
  onCalibrationStart,
  onCalibrationEnd,
}) {
  const [step, setStep] = useState(1);
  const [remaining, setRemaining] = useState(CALIBRATION_SECONDS);
  const [samples, setSamples] = useState({ ear_samples: [], mar_samples: [], blink_events: [] });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const computeStarted = useRef(false);
  const lastClosed = useRef(false);
  const earBaselineRef = useRef(null);
  const active = step === 2;

  useEffect(() => {
    if (!active) return undefined;
    if (frameData?.ear != null) {
      if (earBaselineRef.current === null) {
        earBaselineRef.current = frameData.ear;
      } else {
        earBaselineRef.current = earBaselineRef.current * 0.95 + frameData.ear * 0.05;
      }
      const dynamicThreshold = earBaselineRef.current * 0.75;
      const isClosed = frameData.ear < dynamicThreshold;
      setSamples((prev) => ({
        ear_samples: [...prev.ear_samples, frameData.ear],
        mar_samples: [...prev.mar_samples, frameData.mar || 0],
        blink_events:
          lastClosed.current && !isClosed
            ? [...prev.blink_events, Date.now()]
            : prev.blink_events,
      }));
      lastClosed.current = isClosed;
    }
    return undefined;
  }, [active, frameData]);

  useEffect(() => {
    if (!active) return undefined;
    const interval = window.setInterval(() => setRemaining((v) => v - 1), 1000);
    return () => window.clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (remaining <= 0 && active && !computeStarted.current) {
      computeStarted.current = true;
      computeCalibration({ ...samples, duration_seconds: CALIBRATION_SECONDS })
        .then((data) => {
          setResult(data);
          setStep(3);
          onCalibrationEnd?.();
        })
        .catch(() => {
          setError("Neural computation failed. Please ensure environment lighting is sufficient.");
          onCalibrationEnd?.();
        });
    }
  }, [active, remaining, samples, onCalibrationEnd]);

  const latest = useMemo(
    () => ({ ear: frameData?.ear || 0, mar: frameData?.mar || 0 }),
    [frameData],
  );

  const begin = async () => {
    try {
      await startCalibration(userId);
      setError("");
      setSaved(false);
      setResult(null);
      computeStarted.current = false;
      lastClosed.current = false;
      earBaselineRef.current = null;
      setSamples({ ear_samples: [], mar_samples: [], blink_events: [] });
      setRemaining(CALIBRATION_SECONDS);
      onCalibrationStart?.();
      setStep(2);
    } catch {
      setError("Secure link could not be established. Check system connectivity.");
    }
  };

  const save = async () => {
    try {
      const savedUser = await saveCalibration({
        user_id: userId,
        baseline_blink_rate: result.baseline_blink_rate,
        ear_threshold: result.ear_threshold,
        mar_threshold: result.mar_threshold,
      });
      setSaved(true);
      onSaved?.(savedUser);
    } catch {
      setError("Calibration profile could not be synchronized.");
    }
  };

  const progress = active
    ? Math.round(((CALIBRATION_SECONDS - Math.max(remaining, 0)) / CALIBRATION_SECONDS) * 100)
    : 0;

  return (
    <section className="panel calibration" style={{ padding: 40, marginTop: 32 }}>
      {step === 1 && (
        <div className="calibration-step" style={{ textAlign: "center" }}>
          <div style={{ background: "rgba(79, 140, 255, 0.1)", width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--accent)" }}>
            <Sparkles size={32} />
          </div>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Precision Calibration</h2>
          <p className="muted" style={{ maxWidth: 460, margin: "0 auto 32px", fontSize: 15, lineHeight: 1.6 }}>
            Synchronize your biometric patterns for enhanced detection accuracy. 
            Look straight at the camera and remain alert for {CALIBRATION_SECONDS} seconds.
          </p>
          <button className="primary-btn" onClick={begin} style={{ height: 54, padding: "0 40px", borderRadius: 16 }}>
            Begin Synchronization
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="calibration-step" style={{ textAlign: "center" }}>
          <h2 className="calibration-countdown" style={{ fontSize: 72, marginBottom: 8, color: "var(--text-primary)" }}>
            {Math.max(remaining, 0)}<span style={{ fontSize: 24, color: "var(--text-muted)", marginLeft: 4 }}>s</span>
          </h2>
          <p style={{ fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1, fontSize: 13, marginBottom: 24 }}>
            Capturing behavioral samples...
          </p>
          <div className="calibration-progress-track" style={{ height: 10, background: "var(--bg-elevated)", marginBottom: 24 }}>
            <div className="calibration-progress-fill" style={{ width: `${progress}%`, background: "var(--accent-gradient)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            <div className="metric-pill" style={{ background: "var(--bg-elevated)", border: "none" }}>
              <span className="metric-label">EAR</span>
              <span className="metric-value" style={{ fontWeight: 800 }}>{latest.ear.toFixed(3)}</span>
            </div>
            <div className="metric-pill" style={{ background: "var(--bg-elevated)", border: "none" }}>
              <span className="metric-label">MAR</span>
              <span className="metric-value" style={{ fontWeight: 800 }}>{latest.mar.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="calibration-step" style={{ textAlign: "center" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--safe)" }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Analysis Complete</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 32 }}>
            <div className="panel" style={{ padding: "16px 24px", textAlign: "center", background: "var(--bg-elevated)", border: "none" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Blink Rate</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{result.baseline_blink_rate}/m</div>
            </div>
            <div className="panel" style={{ padding: "16px 24px", textAlign: "center", background: "var(--bg-elevated)", border: "none" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>EAR Threshold</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{result.ear_threshold}</div>
            </div>
            <div className="panel" style={{ padding: "16px 24px", textAlign: "center", background: "var(--bg-elevated)", border: "none" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>MAR Threshold</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{result.mar_threshold}</div>
            </div>
          </div>

          {!saved ? (
            <button className="primary-btn" onClick={save} style={{ height: 54, padding: "0 40px", borderRadius: 16 }}>
              Apply Configuration
            </button>
          ) : (
            <div className="success-text" style={{ justifyContent: "center", fontSize: 16, marginBottom: 16 }}>
              <CheckCircle size={20} />
              Biometric profile synchronized successfully.
            </div>
          )}
          <button
            className="preview-retry"
            style={{ marginTop: 16, background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 14, fontWeight: 600 }}
            onClick={() => { setStep(1); onCalibrationEnd?.(); }}
          >
            <RefreshCw size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Recalibrate sensors
          </button>
        </div>
      )}

      {error && <p className="error-text" style={{ textAlign: "center", marginTop: 20 }}>{error}</p>}
    </section>
  );
}

CalibrationModal.propTypes = {
  userId: PropTypes.number.isRequired,
  frameData: PropTypes.object,
  onSaved: PropTypes.func,
  onCalibrationStart: PropTypes.func,
  onCalibrationEnd: PropTypes.func,
};
