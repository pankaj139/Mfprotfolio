import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlerts, markAlertRead, markAllRead, deleteAlert } from "../services/api";
import { AlertTriangle, Bell, CheckCheck, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import type { Alert } from "../types";

const ALERT_TYPE_LABELS: Record<string, string> = {
  FUND_MANAGER_CHANGE:    "Fund Manager Change",
  CATEGORY_CHANGE:        "Category Reclassification",
  FUND_OBJECTIVE_CHANGE:  "Objective Change",
  FUND_NAME_CHANGE:       "Name Change",
  ASSET_ALLOCATION_CHANGE:"Asset Allocation Shift",
  SECTOR_SHIFT:           "Sector Reallocation",
  HOLDINGS_CHANGE:        "Holdings Change",
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  FUND_MANAGER_CHANGE:    "👤",
  CATEGORY_CHANGE:        "🔄",
  FUND_OBJECTIVE_CHANGE:  "📋",
  FUND_NAME_CHANGE:       "✏️",
  ASSET_ALLOCATION_CHANGE:"⚖️",
  SECTOR_SHIFT:           "📊",
  HOLDINGS_CHANGE:        "📈",
};

function AlertCard({ alert, onRead, onDelete }: { alert: Alert; onRead: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <div className={clsx(
      "card border-l-4 transition-all",
      !alert.is_read && "bg-blue-50/30",
      alert.severity === "HIGH"   ? "border-l-red-400" :
      alert.severity === "MEDIUM" ? "border-l-amber-400" : "border-l-blue-400"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">
            {ALERT_TYPE_ICONS[alert.alert_type] ?? "🔔"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-800">{alert.title}</h3>
              {!alert.is_read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">
              {alert.fund_name?.split("-")[0].trim()} ·{" "}
              {format(new Date(alert.created_at), "d MMM yyyy, hh:mm a")}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">{alert.message}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={clsx(
                "text-xs px-2 py-0.5 rounded-full font-semibold",
                alert.severity === "HIGH"   ? "bg-red-100 text-red-700" :
                alert.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              )}>
                {alert.severity}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {!alert.is_read && (
            <button
              onClick={() => onRead(alert.id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              title="Mark as read"
            >
              <CheckCheck size={15} />
            </button>
          )}
          <button
            onClick={() => onDelete(alert.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  const qc = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts", unreadOnly],
    queryFn: () => getAlerts(unreadOnly),
    refetchInterval: 30_000,
  });

  const readMut = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const markAllMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const filtered = alerts.filter((a) =>
    severityFilter === "ALL" ? true : a.severity === severityFilter
  );

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="p-6 space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
              unreadOnly ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"
            )}
          >
            <Bell size={14} />
            {unreadOnly ? "Showing Unread" : "Show Unread Only"}
            {unreadCount > 0 && (
              <span className="bg-white/20 text-xs font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex gap-1">
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold",
                  severityFilter === s
                    ? s === "HIGH" ? "bg-red-600 text-white"
                      : s === "MEDIUM" ? "bg-amber-500 text-white"
                      : s === "LOW" ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => markAllMut.mutate()}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <AlertTriangle size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No alerts found</p>
          <p className="text-sm mt-1">Your portfolio is all clear!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={(id) => readMut.mutate(id)}
              onDelete={(id) => {
                if (confirm("Delete this alert?")) deleteMut.mutate(id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
