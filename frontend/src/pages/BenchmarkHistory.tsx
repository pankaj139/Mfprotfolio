import { useQuery } from "@tanstack/react-query";
import { getAllBenchmarkHistory } from "../services/api";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import clsx from "clsx";
import type { BenchmarkPeriod } from "../types";

const PERIODS = [
  { key: "5y",  label: "5 Year" },
  { key: "10y", label: "10 Year" },
  { key: "15y", label: "15 Year" },
];

function PeriodCell({ period }: { period?: BenchmarkPeriod }) {
  if (!period) return <td className="px-4 py-4 text-center"><span className="text-gray-300 text-sm">—</span></td>;
  if (period.outperformed === null) {
    return (
      <td className="px-4 py-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <MinusCircle size={18} className="text-gray-300" />
          <span className="text-xs text-gray-400">Fund too young</span>
        </div>
      </td>
    );
  }
  return (
    <td className="px-4 py-4 text-center">
      <div className="flex flex-col items-center gap-1">
        {period.outperformed ? (
          <CheckCircle size={20} className="text-emerald-500" />
        ) : (
          <XCircle size={20} className="text-red-500" />
        )}
        <div className="text-center">
          <p className={clsx("text-sm font-bold", period.outperformed ? "text-emerald-700" : "text-red-700")}>
            {period.fund?.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">vs {period.benchmark?.toFixed(1)}%</p>
          <p className={clsx(
            "text-xs font-semibold mt-0.5",
            period.outperformed ? "text-emerald-600" : "text-red-600"
          )}>
            {period.outperformed ? "+" : ""}{((period.fund ?? 0) - (period.benchmark ?? 0)).toFixed(1)}%
          </p>
        </div>
      </div>
    </td>
  );
}

export default function BenchmarkHistory() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["all-benchmark-history"],
    queryFn: getAllBenchmarkHistory,
  });

  const totalFunds = history.length;
  const outperformedAll5y = history.filter((h) => h.periods?.["5y"]?.outperformed === true).length;
  const outperformedAll10y = history.filter((h) => h.periods?.["10y"]?.outperformed === true).length;

  return (
    <div className="p-6 space-y-6">
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Summary chips */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-emerald-600">{outperformedAll5y}/{totalFunds}</p>
            <p className="text-sm text-gray-500 mt-1">Beat Benchmark (5Y)</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{outperformedAll10y}/{totalFunds}</p>
            <p className="text-sm text-gray-500 mt-1">Beat Benchmark (10Y)</p>
          </div>
          <div className="card text-center col-span-2 md:col-span-1">
            <p className="text-3xl font-bold text-gray-700">CAGR</p>
            <p className="text-sm text-gray-500 mt-1">Returns shown as CAGR %</p>
          </div>
        </div>
      )}

      {/* Main table */}
      {history.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Benchmark Beating History</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Green = outperformed benchmark. Shows fund CAGR vs benchmark CAGR and alpha (±%).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fund</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Benchmark</th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                      {p.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const score = [h.periods["5y"], h.periods["10y"], h.periods["15y"]].filter(
                    (p) => p?.outperformed === true
                  ).length;
                  const total = [h.periods["5y"], h.periods["10y"], h.periods["15y"]].filter(
                    (p) => p?.outperformed !== null && p?.outperformed !== undefined
                  ).length;
                  return (
                    <tr key={h.fund_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-800">{h.fund_name.split("-")[0].trim()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-500">{h.benchmark}</p>
                      </td>
                      <PeriodCell period={h.periods["5y"]} />
                      <PeriodCell period={h.periods["10y"]} />
                      <PeriodCell period={h.periods["15y"]} />
                      <td className="px-4 py-4 text-center">
                        <div className={clsx(
                          "inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold",
                          score === total ? "bg-emerald-100 text-emerald-700" :
                          score > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>
                          {score}/{total}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card flex flex-wrap gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Outperformed benchmark</span>
        <span className="flex items-center gap-1.5"><XCircle size={16} className="text-red-500" /> Underperformed benchmark</span>
        <span className="flex items-center gap-1.5"><MinusCircle size={16} className="text-gray-300" /> Insufficient history</span>
      </div>
    </div>
  );
}
