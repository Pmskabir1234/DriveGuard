import { useCallback, useEffect, useRef, useState } from "react";
import { createWebSocket } from "../api/apiClient";

const FRAME_INTERVAL_MS = 100; // send 10 frames/sec to backend
const JPEG_QUALITY = 0.7;      // balance quality vs bandwidth

/**
 * Manages the WebSocket connection and frame-sending loop.
 *
 * @param {number}  userId   - user id passed as query param
 * @param {boolean} enabled  - connect when true, disconnect when false
 * @param {React.RefObject} videoRef - ref to the <video> element to capture frames from
 */
export function useWebSocket(userId, enabled = true, videoRef = null) {
  const [frameData, setFrameData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const retriesRef = useRef(0);
  const cancelledRef = useRef(false);

  // Lazily create an off-screen canvas for frame capture
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    return canvasRef.current;
  }, []);

  const stopSending = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startSending = useCallback(
    (socket) => {
      stopSending();
      intervalRef.current = setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) return;

        // Get the video element — either from the passed ref or by querying the DOM
        const video = videoRef?.current ?? document.querySelector("video.video-feed");
        if (!video || video.readyState < 2 || video.videoWidth === 0) return;

        const canvas = getCanvas();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        // Encode as JPEG and send
        const b64 = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        socket.send(JSON.stringify({ frame: b64 }));
      }, FRAME_INTERVAL_MS);
    },
    [videoRef, getCanvas, stopSending],
  );

  useEffect(() => {
    cancelledRef.current = false;

    if (!enabled) {
      stopSending();
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
      setFrameData(null);
      return undefined;
    }

    const connect = () => {
      if (cancelledRef.current) return;

      const socket = createWebSocket(userId);
      socketRef.current = socket;

      socket.onopen = () => {
        retriesRef.current = 0;
        setIsConnected(true);
        setError(null);
        startSending(socket);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pong) return; // ignore keepalive replies
          setFrameData(data);
          if (!data.error) setError(null);
        } catch {
          setError("Unable to parse stream message.");
        }
      };

      socket.onerror = () => {
        setError("Stream connection error.");
      };

      socket.onclose = () => {
        stopSending();
        setIsConnected(false);
        if (!cancelledRef.current && retriesRef.current < 8) {
          const delay = Math.min(1000 * 2 ** retriesRef.current, 15000);
          retriesRef.current += 1;
          setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      cancelledRef.current = true;
      stopSending();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [userId, enabled, startSending, stopSending]);

  return { frameData, isConnected, error };
}
