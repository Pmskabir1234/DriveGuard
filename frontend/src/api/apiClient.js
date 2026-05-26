import axios from "axios";
import { API_BASE_URL, WS_BASE_URL } from "../constants";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const startSession = (userId) => apiClient.post("/sessions/start", { user_id: userId }).then((res) => res.data);
export const endSession = (sessionId) => apiClient.post(`/sessions/${sessionId}/end`).then((res) => res.data);
export const getSession = (sessionId) => apiClient.get(`/sessions/${sessionId}`).then((res) => res.data);
export const getSessionEvents = (sessionId) => apiClient.get(`/sessions/${sessionId}/events`).then((res) => res.data);
export const getRecentEvents = (userId, limit = 20) =>
  apiClient.get("/events/recent", { params: { user_id: userId, limit } }).then((res) => res.data);
export const startCalibration = (userId) =>
  apiClient.post("/calibration/start", null, { params: { user_id: userId } }).then((res) => res.data);
export const computeCalibration = (samples) => apiClient.post("/calibration/compute", samples).then((res) => res.data);
export const saveCalibration = (payload) => apiClient.post("/calibration/save", payload).then((res) => res.data);
export const getDailyAnalytics = (userId) =>
  apiClient.get("/analytics/daily", { params: { user_id: userId } }).then((res) => res.data);
export const getTrendAnalytics = (userId) =>
  apiClient.get("/analytics/trends", { params: { user_id: userId } }).then((res) => res.data);
export const getSummaryAnalytics = (userId) =>
  apiClient.get("/analytics/summary", { params: { user_id: userId } }).then((res) => res.data);

export function createWebSocket(userId) {
  return new WebSocket(`${WS_BASE_URL}/ws/stream?user_id=${encodeURIComponent(userId)}`);
}

