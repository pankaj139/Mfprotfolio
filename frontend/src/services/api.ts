import axios from "axios";
import type {
  Fund,
  HoldingsComparison,
  SectorComparison,
  Alert,
  PerformanceReturns,
  BenchmarkHistory,
  NewsItem,
  DashboardSummary,
} from "../types";

const api = axios.create({ baseURL: "/api" });

// Portfolio
export const getPortfolio = () =>
  api.get<Fund[]>("/portfolio/").then((r) => r.data);

export const addFund = (data: Partial<Fund>) =>
  api.post<Fund>("/portfolio/", data).then((r) => r.data);

export const removeFund = (id: number) =>
  api.delete(`/portfolio/${id}`);

export const searchFunds = (q: string) =>
  api.get<{ schemeCode: number; schemeName: string }[]>("/portfolio/search", { params: { q } }).then((r) => r.data);

// Holdings
export const getHoldingsComparison = (fundId: number) =>
  api.get<HoldingsComparison>(`/holdings/${fundId}/compare`).then((r) => r.data);

// Sectors
export const getSectorComparison = (fundId: number, threshold = 2.0) =>
  api.get<SectorComparison>(`/sectors/${fundId}/compare`, { params: { threshold } }).then((r) => r.data);

// Performance
export const getFundReturns = (fundId: number) =>
  api.get<PerformanceReturns>(`/performance/${fundId}/returns`).then((r) => r.data);

export const getAllReturns = () =>
  api.get<PerformanceReturns[]>("/performance/all/returns").then((r) => r.data);

export const getNavHistory = (fundId: number) =>
  api.get(`/performance/${fundId}/nav-history`).then((r) => r.data);

export const getBenchmarkHistory = (fundId: number) =>
  api.get<BenchmarkHistory>(`/performance/${fundId}/benchmark-history`).then((r) => r.data);

export const getAllBenchmarkHistory = () =>
  api.get<BenchmarkHistory[]>("/performance/all/benchmark-history").then((r) => r.data);

// Alerts
export const getAlerts = (unreadOnly = false) =>
  api.get<Alert[]>("/alerts/", { params: { unread_only: unreadOnly } }).then((r) => r.data);

export const markAlertRead = (id: number) =>
  api.put<Alert>(`/alerts/${id}/read`).then((r) => r.data);

export const markAllRead = () =>
  api.put("/alerts/mark-all-read").then((r) => r.data);

export const deleteAlert = (id: number) =>
  api.delete(`/alerts/${id}`);

export const getUnreadCount = () =>
  api.get<{ count: number; breakdown: Record<string, number> }>("/alerts/unread-count").then((r) => r.data);

// News
export const getAllNews = () =>
  api.get<{ news: NewsItem[] }>("/news/").then((r) => r.data);

export const getFundNews = (fundId: number) =>
  api.get<{ fund_name: string; news: NewsItem[] }>(`/news/${fundId}`).then((r) => r.data);

// Dashboard
export const getDashboardSummary = () =>
  api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data);
