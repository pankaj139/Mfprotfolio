import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPortfolio, getSectorComparison } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import clsx from "clsx";

const COLORS = {
  INCREASED: "#22c55e",
  DECREASED: "#ef4444",
  NEW:       "#a855f7",
  EXITED:    "#f97316",
  UNCHANGED: "#94a3b8",
};

export default function SectorTracker() {
  const { data: funds = [] } = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });
  const [selectedFund, setSelectedFund] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(2.0);

  const activeFundId = selectedFund ?? funds[0]?.id ?? null;

  const { data: comparison, isLoading } = useQuery({
    queryKey: ["sectors-compare", activeFundId, threshold],
    queryFn: () => getSectorComparison(activeFundId!, threshold),
    enabled: activeFundId != null,
  });

  const chartData = comparison?.changes
    .filter((c) => c.current_weight != null || c.previous_weight != null)
    .map((c) => ({
      name: c.sector_name.length > 18 ? c.sector_name.slice(0, 16) + "…" : c.sector_name,
      fullName: c.sector_name,
      current: c.current_weight ?? 0,
      previous: c.previous_weight ?? 0,
      change: c.change ?? 0,
      status: c.status,
    }));

  return (
    <div className="p-6 space-y-5">
      {/* Fund selector */}
      <div className="flex flex-wrap gap-2">
        {funds.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFund(f.id)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeFundId === f.id
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
            )}
          >
            {f.scheme_name.split("-")[0].trim()}
          </button>
        ))}
      </div>

      {/* Threshold control */}
      <div className="card flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Highlight threshold:
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 5].map((v) => (
            <button
              key={v}
              onClick={() => setThreshold(v)}
              className={clsx(
                "px-3 py-1 rounded-lg text-sm font-medium",
                threshold === v ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              ±{v}%
            </button>
          ))}
        </div>
        {comparison && (
          <span className="text-xs text-gray-400 ml-auto">
            {comparison.previous_month} → {comparison.current_month}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {comparison && (
        <>
          {/* Bar chart */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">
              Sector Allocation Comparison — {comparison.fund_name.split("-")[0].trim()}
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                  labelFormatter={(label) => chartData?.find((d) => d.name === label)?.fullName ?? label}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="previous" name="Previous Month" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                <Bar dataKey="current" name="Current Month" radius={[3, 3, 0, 0]}>
                  {chartData?.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.status as keyof typeof COLORS] ?? "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(COLORS).map(([status, color]) => (
                <span key={status} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
                  {status.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sector</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{comparison.current_month}</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{comparison.previous_month}</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Change</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.changes.map((c, i) => (
                    <tr key={i} className={clsx("border-b border-gray-50 hover:bg-gray-50/50", c.status !== "UNCHANGED" && "font-medium")}>
                      <td className="px-3 py-2.5 text-sm text-gray-800">{c.sector_name}</td>
                      <td className="px-3 py-2.5 text-sm font-mono text-right text-gray-700">
                        {c.current_weight != null ? `${c.current_weight.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono text-right text-gray-500">
                        {c.previous_weight != null ? `${c.previous_weight.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono text-right">
                        <span className={clsx(
                          (c.change ?? 0) > 0 ? "text-emerald-600" : (c.change ?? 0) < 0 ? "text-red-600" : "text-gray-400"
                        )}>
                          {(c.change ?? 0) > 0 ? "+" : ""}{c.change?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {c.status !== "UNCHANGED" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: COLORS[c.status as keyof typeof COLORS] + "22",
                              color: COLORS[c.status as keyof typeof COLORS],
                            }}>
                            {c.status.replace("_", " ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
