import { useCallback, useEffect, useState } from "react";
import { endSession, startSession } from "../api/apiClient";

export function useSession(userId) {
  const [sessionId, setSessionId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionActive || !startedAt) return undefined;
    const interval = window.setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionActive, startedAt]);

  const handleStart = useCallback(async () => {
    try {
      const session = await startSession(userId);
      setSessionId(session.id);
      setSessionActive(true);
      setStartedAt(Date.now());
      setDurationSeconds(0);
      setError(null);
      return session;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [userId]);

  const handleEnd = useCallback(async () => {
    if (!sessionId) return null;
    try {
      const session = await endSession(sessionId);
      setSessionActive(false);
      setError(null);
      return session;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [sessionId]);

  return { sessionId, sessionActive, startedAt, durationSeconds, error, startSession: handleStart, endSession: handleEnd };
}

