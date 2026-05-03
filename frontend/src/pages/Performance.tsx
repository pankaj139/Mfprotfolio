import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPortfolio, getAllReturns, getNavHistory } from "../services/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import clsx from "clsx";

const PERIODS = [
  { key: "1y",              label: "1 Year" },
  { key: "3y",              label: "3 Year" },
  { key: "5y",              label: "5 Year" },
  { key: "since_inception", label: "Since Inception" },
];

function ReturnCell({ value, benchmark, category }: { value?: number; benchmark?: number; category?: number }) {
  if (value == null) return <span className="text-gray-300 text-sm">N/A</span>;
  const vsBenchmark = benchmark != null ? value - benchmark : null;
  const vsCategory = category != null ? value - category : null;
  return (
    <div>
      <p className={clsx("text-base font-bold", value >= 0 ? "text-gray-800" : "text-red-600")}>
        {value.toFixed(2)}%
      </p>
      {vsBenchmark != null && (
        <p className={clsx("text-xs", vsBenchmark >= 0 ? "text-emerald-600" : "text-red-500")}>
          {vsBenchmark >= 0 ? "▲" : "▼"} {Math.abs(vsBenchmark).toFixed(2)}% vs idx
        </p>
      )}
      {vsCategory != null && (
        <p className={clsx("text-xs", vsCategory >= 0 ? "text-blue-600" : "text-amber-600")}>
          {vsCategory >= 0 ? "▲" : "▼"} {Math.abs(vsCategory).toFixed(2)}% vs cat
        </p>
      )}
    </div>
  );
}

export default function Performance() {
  const { data: funds = [] } = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });
  const { data: allReturns = [], isLoading } = useQuery({
    queryKey: ["all-returns"],
    queryFn: getAllReturns,
  });

  const [navFundId, setNavFundId] = useState<number | null>(null);
  const activeFundId = navFundId ?? funds[0]?.id ?? null;

  const { data: navData, isLoading: navLoading } = useQuery({
    queryKey: ["nav-history", activeFundId],
    queryFn: () => getNavHistory(activeFundId!),
    enabled: activeFundId != null,
  });

  // Build NAV chart data (last 365 entries, newest first → reverse)
  const navChartData = navData?.nav_history
    ? [...navData.nav_history].reverse().map((entry: { date: string; nav: string }) => ({
        date: entry.date,
        nav: parseFloat(entry.nav),
      }))
    : [];

  // Bar chart comparing all funds for a period
  const [selectedPeriod, setSelectedPeriod] = useState("1y");

  const barData = allReturns.map((r) => ({
    name: r.scheme_name.split("-")[0].trim().slice(0, 18),
    fund: r.returns[selectedPeriod as keyof typeof r.returns] ?? null,
    benchmark: r.benchmark_returns[selectedPeriod] ?? null,
    category: r.category_avg_returns[selectedPeriod] ?? null,
  })).filter((d) => d.fund != null);

  return (
    <div className="p-6 space-y-6">
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Returns table */}
      {allReturns.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Fund Returns vs Benchmark & Category Average</h2>
            <p className="text-xs text-gray-400 mt-0.5">CAGR returns. ▲/▼ shows alpha over benchmark/category.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fund</th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allReturns.map((r) => (
                  <tr key={r.fund_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{r.scheme_name.split("-")[0].trim()}</p>
                      <p className="text-xs text-gray-400">{r.category} · {r.benchmark}</p>
                    </td>
                    {PERIODS.map((p) => {
                      const key = p.key as keyof typeof r.returns;
                      const bmKey = p.key === "since_inception" ? "since_inception" : p.key;
                      return (
                        <td key={p.key} className="px-4 py-3 text-center">
                          <ReturnCell
                            value={r.returns[key] ?? undefined}
                            benchmark={r.benchmark_returns[bmKey]}
                            category={r.category_avg_returns[bmKey]}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bar comparison chart */}
      {barData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Return Comparison</h2>
            <div className="flex gap-1">
              {PERIODS.filter((p) => p.key !== "since_inception").map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPeriod(p.key)}
                  className={clsx(
                    "px-3 py-1 rounded-lg text-xs font-medium",
                    selectedPeriod === p.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v?.toFixed(2)}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="fund" name="Fund" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="benchmark" name="Benchmark" fill="#93c5fd" radius={[3, 3, 0, 0]} />
              <Bar dataKey="category" name="Category Avg" fill="#d1d5db" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* NAV history chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">NAV History (1 Year)</h2>
          <div className="flex flex-wrap gap-1">
            {funds.map((f) => (
              <button
                key={f.id}
                onClick={() => setNavFundId(f.id)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-medium",
                  activeFundId === f.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {f.scheme_name.split("-")[0].trim().slice(0, 14)}
              </button>
            ))}
          </div>
        </div>
        {navLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : navChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={navChartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(v) => {
                  const parts = v.split("-");
                  return parts.length === 3 ? `${parts[0]}-${parts[1]}` : v;
                }}
                interval={Math.floor(navChartData.length / 6)}
              />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => [`₹${v.toFixed(2)}`, "NAV"]} />
              <Line type="monotone" dataKey="nav" stroke="#3b82f6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">No NAV history available (API unreachable)</p>
        )}
      </div>
    </div>
  );
}
