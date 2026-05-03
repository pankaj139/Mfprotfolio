import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getAlerts } from "../services/api";
import {
  Briefcase,
  Bell,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";

const ALERT_TYPE_LABELS: Record<string, string> = {
  FUND_MANAGER_CHANGE: "Fund Manager Change",
  CATEGORY_CHANGE: "Category Reclassification",
  FUND_OBJECTIVE_CHANGE: "Objective Change",
  FUND_NAME_CHANGE: "Name Change",
  ASSET_ALLOCATION_CHANGE: "Asset Allocation Shift",
  SECTOR_SHIFT: "Sector Reallocation",
  HOLDINGS_CHANGE: "Holdings Change",
};

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardSummary,
  });

  const { data: recentAlerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getAlerts(false),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const unreadHigh = summary?.severity_counts?.HIGH ?? 0;
  const unreadMedium = summary?.severity_counts?.MEDIUM ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{summary?.total_funds ?? 0}</p>
            <p className="text-sm text-gray-500">Funds Tracked</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{summary?.unread_alerts ?? 0}</p>
            <p className="text-sm text-gray-500">Unread Alerts</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{unreadHigh}</p>
            <p className="text-sm text-gray-500">High Priority</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(summary?.total_funds ?? 0) - unreadHigh - unreadMedium}</p>
            <p className="text-sm text-gray-500">No Issues</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fund list */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase size={16} className="text-blue-600" /> Your Portfolio
          </h2>
          <div className="space-y-3">
            {summary?.funds.map((f) => (
              <div key={f.id} className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-tight">{f.scheme_name.split("-")[0].trim()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.amc}</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                  {f.sub_category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-amber-500" /> Recent Alerts
          </h2>
          <div className="space-y-3">
            {recentAlerts?.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={clsx(
                  "border-l-4 pl-3 py-1",
                  alert.severity === "HIGH" ? "border-red-400" :
                  alert.severity === "MEDIUM" ? "border-amber-400" : "border-blue-400"
                )}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 leading-tight flex-1">{alert.title}</p>
                  {!alert.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  {format(new Date(alert.created_at), "d MMM yyyy")}
                </p>
              </div>
            ))}
            {!recentAlerts?.length && (
              <p className="text-sm text-gray-400">No recent alerts</p>
            )}
          </div>
          {(recentAlerts?.length ?? 0) > 5 && (
            <a href="/alerts" className="text-xs text-blue-600 hover:underline mt-3 block">
              View all alerts →
            </a>
          )}
        </div>
      </div>

      {/* Alert type breakdown */}
      {summary && Object.keys(summary.type_counts).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" /> Alert Type Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(summary.type_counts).map(([type, count]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{ALERT_TYPE_LABELS[type] ?? type}</p>
                <p className="text-xl font-bold text-gray-800">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
