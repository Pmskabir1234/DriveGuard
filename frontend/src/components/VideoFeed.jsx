import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Eye, RefreshCw } from "lucide-react";

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
 *
 * Forwards a ref to the underlying <video> element so the parent can
 * capture frames for sending to the backend.
 */
const VideoFeed = forwardRef(function VideoFeed({ frameData, isConnected }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const risk = frameData?.risk_level || "Safe";
  const faceDetected = frameData ? frameData.face_detected : true;

  // Expose the video element via the forwarded ref
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

  // Handle backend error states — clear when resolved
  useEffect(() => {
    const backendError = frameData?.error;
    if (!backendError) {
      setCameraError((prev) => (prev.startsWith("Backend") ? "" : prev));
      return;
    }
    if (backendError === "vision_unavailable") {
      setCameraError("Backend vision dependencies unavailable. Check MediaPipe installation.");
    }
    // invalid_frame is transient — don't show it as a persistent error
  }, [frameData?.error]);

  const previewMessage = isStartingCamera ? "Starting camera preview…" : cameraError;

  return (
    <section className={`video-shell ${RISK_CLASS[risk] || "risk-safe"}`}>
      <video ref={videoRef} autoPlay playsInline muted className="video-feed" />

      {/* Loading / error overlay */}
      {previewMessage && (
        <div className="video-state">
          <Eye size={32} style={{ opacity: 0.4 }} />
          <span>{previewMessage}</span>
          {!isStartingCamera && (
            <button className="preview-retry" onClick={startPreview} type="button">
              <RefreshCw size={13} style={{ verticalAlign: "middle" }} />
              &nbsp;Retry preview
            </button>
          )}
        </div>
      )}

      {/* Connection status */}
      <div className={`status-pill ${isConnected ? "online" : "offline"}`}>
        <span className={`conn-dot ${isConnected ? "live" : "offline"}`} />
        {isConnected ? "Live" : "Offline"}
      </div>

      {/* Danger badges */}
      {frameData?.phone_detected && (
        <div className="danger-badge">📱 Phone Detected</div>
      )}
      {frameData && !faceDetected && (
        <div className={`danger-badge ${frameData?.phone_detected ? "lower" : ""}`}>
          👁 Face Not Detected
        </div>
      )}

      {/* Metric pills */}
      <div className="metric-overlay">
        <div className="metric-pill">
          <span className="metric-label">EAR</span>
          <span className="metric-value">{Number(frameData?.ear || 0).toFixed(3)}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">MAR</span>
          <span className="metric-value">{Number(frameData?.mar || 0).toFixed(3)}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Pose</span>
          <span className="metric-value">{frameData?.head_pose?.label || "—"}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Gaze</span>
          <span className="metric-value">{frameData?.gaze || "—"}</span>
        </div>
      </div>

      {/* Face detection indicator dot */}
      <div
        className={`face-indicator ${faceDetected ? "detected" : "undetected"}`}
        title={faceDetected ? "Face detected" : "No face detected"}
      />
    </section>
  );
});

VideoFeed.propTypes = {
  frameData: PropTypes.object,
  isConnected: PropTypes.bool.isRequired,
};

export default VideoFeed;
