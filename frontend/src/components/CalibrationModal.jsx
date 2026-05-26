import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
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
  // Use a dynamic threshold derived from the first few EAR samples rather than
  // a hardcoded 0.22 value that ignores individual anatomy.
  const earBaselineRef = useRef(null);
  const active = step === 2;

  useEffect(() => {
    if (!active) return undefined;
    if (frameData?.ear != null) {
      // Build a dynamic baseline from the first 30 samples (~3 s at 10 fps)
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
          setError("Calibration could not be computed. Check backend connection and try again.");
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
      setError("Calibration could not start. Check backend connection and try again.");
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
      setError("Calibration could not be saved. Check backend connection and try again.");
    }
  };

  const progress = active
    ? Math.round(((CALIBRATION_SECONDS - Math.max(remaining, 0)) / CALIBRATION_SECONDS) * 100)
    : 0;

  return (
    <section className="panel calibration">
      {step === 1 && (
        <div className="calibration-step">
          <h2>Calibration</h2>
          <p className="muted">
            Look straight at the camera, stay alert, and blink normally for{" "}
            {CALIBRATION_SECONDS} seconds. This personalises your fatigue thresholds.
          </p>
          <button className="primary-btn" onClick={begin}>
            Start Calibration
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="calibration-step">
          <h2 className="calibration-countdown">{Math.max(remaining, 0)}s</h2>
          <div className="calibration-progress-track">
            <div className="calibration-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="muted">
            <Loader2 size={14} className="spin-icon" />
            &nbsp;EAR {latest.ear.toFixed(3)} &nbsp;|&nbsp; MAR {latest.mar.toFixed(3)}
          </p>
        </div>
      )}

      {step === 3 && result && (
        <div className="calibration-step">
          <h2>
            <CheckCircle size={18} style={{ color: "#10b981", verticalAlign: "middle" }} />
            &nbsp;Calibration Complete
          </h2>
          <p className="muted">
            Blink rate&nbsp;<strong>{result.baseline_blink_rate}/min</strong>
            &nbsp;·&nbsp;EAR threshold&nbsp;<strong>{result.ear_threshold}</strong>
            &nbsp;·&nbsp;MAR threshold&nbsp;<strong>{result.mar_threshold}</strong>
          </p>
          {!saved ? (
            <button className="primary-btn" onClick={save}>
              Save Calibration
            </button>
          ) : (
            <p className="success-text">
              <CheckCircle size={14} style={{ verticalAlign: "middle" }} />
              &nbsp;Saved — thresholds will apply on the next session.
            </p>
          )}
          <button
            className="preview-retry"
            style={{ marginTop: 8 }}
            onClick={() => { setStep(1); onCalibrationEnd?.(); }}
          >
            <RefreshCw size={13} style={{ verticalAlign: "middle" }} />
            &nbsp;Recalibrate
          </button>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
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
