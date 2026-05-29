import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Eye, RefreshCw, Smartphone, UserMinus, Wifi, WifiOff } from "lucide-react";

function cameraErrorMessage(error) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "Camera preview requires a modern browser with webcam support.";
  }
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  if (window.location.protocol !== "https:" && !isLocalhost) {
    return "Camera preview is blocked on non-HTTPS URLs. Open http://localhost:5173.";
  }
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Camera permission was blocked. Allow camera access in the browser.";
  }
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
    return "No available webcam was found for preview.";
  }
  if (error?.name === "NotReadableError" || error?.name === "AbortError") {
    return "Webcam is busy. Close other camera apps and retry.";
  }
  return `Camera preview unavailable${error?.name ? ` (${error.name})` : ""}.`;
}

const RISK_CLASS = { Safe: "risk-safe", Moderate: "risk-moderate", High: "risk-high" };

/**
 * Displays local webcam video with live detection overlays.
 */
const VideoFeed = forwardRef(function VideoFeed({ frameData, isConnected }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const risk = frameData?.risk_level || "Safe";
  const faceDetected = frameData ? frameData.face_detected : true;

  useImperativeHandle(ref, () => videoRef.current, []);

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startPreview = useCallback(async () => {
    stopPreview();
    setIsStartingCamera(true);
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia_unavailable");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError(cameraErrorMessage(err));
    } finally {
      setIsStartingCamera(false);
    }
  }, [stopPreview]);

  useEffect(() => {
    startPreview();
    return stopPreview;
  }, [startPreview, stopPreview]);

  useEffect(() => {
    const backendError = frameData?.error;
    if (!backendError) {
      setCameraError((prev) => (prev.startsWith("Backend") ? "" : prev));
      return;
    }
    if (backendError === "vision_unavailable") {
      setCameraError("Backend vision dependencies unavailable. Check MediaPipe installation.");
    }
  }, [frameData?.error]);

  const previewMessage = isStartingCamera ? "Starting secure video stream…" : cameraError;

  const getMetricStatus = (label, value) => {
    if (label === "EAR") {
      if (value < 0.22) return "critical";
      if (value < 0.28) return "warning";
      return "safe";
    }
    if (label === "MAR") {
      if (value > 0.65) return "critical";
      if (value > 0.45) return "warning";
      return "safe";
    }
    if (label === "POSE") {
      if (String(value).toLowerCase().includes("forward")) return "safe";
      if (String(value).toLowerCase().includes("unknown")) return "warning";
      return "critical";
    }
    if (label === "GAZE") {
      if (String(value).toLowerCase().includes("center")) return "safe";
      return "warning";
    }
    return "safe";
  };

  const metrics = [
    { label: "EAR", sub: "Eye Aspect Ratio", value: Number(frameData?.ear || 0).toFixed(3) },
    { label: "MAR", sub: "Mouth Aspect Ratio", value: Number(frameData?.mar || 0).toFixed(3) },
    { label: "POSE", sub: "Head Pose", value: frameData?.head_pose?.label || "—" },
    { label: "GAZE", sub: "Gaze Direction", value: frameData?.gaze || "—" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section className={`video-shell panel ${RISK_CLASS[risk] || "risk-safe"}`} style={{ padding: 0, border: "none", position: "relative", overflow: "hidden" }}>
        <video ref={videoRef} autoPlay playsInline muted className="video-feed" style={{ borderRadius: "inherit", display: "block", width: "100%" }} />

        {/* Loading / error overlay */}
        {previewMessage && (
          <div className="video-state" style={{ background: "rgba(5, 8, 22, 0.8)", backdropFilter: "blur(24px)" }}>
            <div className="brand-orb" style={{ width: 48, height: 48, marginBottom: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>{previewMessage}</span>
            {!isStartingCamera && (
              <button className="primary-btn" onClick={startPreview} style={{ marginTop: 16, height: 44, padding: "0 24px" }}>
                <RefreshCw size={16} />
                &nbsp;Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Connection status */}
        <div className={`status-pill ${isConnected ? "online" : "offline"}`} style={{ top: 24, left: 24, padding: "8px 16px", fontSize: 12 }}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? "SECURE FEED" : "FEED OFFLINE"}
        </div>

        {/* Danger badges */}
        <div style={{ position: "absolute", top: 24, right: 24, display: "grid", gap: 12, zIndex: 5 }}>
          {frameData?.phone_detected && (
            <div className="danger-badge" style={{ background: "rgba(239, 68, 68, 0.9)", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}>
              <Smartphone size={16} fill="currentColor" />
              PHONE DETECTED
            </div>
          )}
          {frameData && !faceDetected && (
            <div className="danger-badge" style={{ background: "rgba(245, 158, 11, 0.9)", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}>
              <UserMinus size={16} fill="currentColor" />
              FACE LOST
            </div>
          )}
        </div>

        {/* Face detection indicator dot */}
        <div
          className={`face-indicator ${faceDetected ? "detected" : "undetected"}`}
          style={{ bottom: 32, right: 32, width: 14, height: 14 }}
        />
      </section>

      {/* Driver Metrics Cards */}
      <div style={{ display: "flex", gap: 20, width: "100%" }}>
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className={`status-dot ${getMetricStatus(m.label, m.value)}`} />
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-primary)" }}>
              {m.label}
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)", marginTop: 2 }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

VideoFeed.propTypes = {
  frameData: PropTypes.object,
  isConnected: PropTypes.bool.isRequired,
};

export default VideoFeed;
