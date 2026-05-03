import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPortfolio, getHoldingsComparison } from "../services/api";
import { ArrowUp, ArrowDown, Plus, Minus, Minus as Dash } from "lucide-react";
import clsx from "clsx";
import type { HoldingChange } from "../types";

const STATUS_CONFIG = {
  NEW_BUY:   { label: "New Buy",    bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", Icon: Plus },
  FULL_EXIT: { label: "Full Exit",  bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     Icon: Minus },
  INCREASED: { label: "Increased",  bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",    Icon: ArrowUp },
  DECREASED: { label: "Decreased",  bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   Icon: ArrowDown },
  UNCHANGED: { label: "Unchanged",  bg: "bg-gray-50",     text: "text-gray-500",    border: "border-gray-100",    Icon: Dash },
};

function HoldingRow({ h }: { h: HoldingChange }) {
  const cfg = STATUS_CONFIG[h.status];
  const StatusIcon = cfg.Icon;
  return (
    <tr className={clsx("border-b border-gray-50 hover:bg-gray-50/50 transition-colors")}>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <span className={clsx("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", cfg.bg)}>
            <StatusIcon size={12} className={cfg.text} />
          </span>
          <div>
            <p className="text-sm font-medium text-gray-800">{h.stock_name}</p>
            {h.sector && <p className="text-xs text-gray-400">{h.sector}</p>}
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className={clsx("text-sm font-mono", h.current_weight ? "text-gray-800" : "text-gray-300")}>
          {h.current_weight != null ? `${h.current_weight.toFixed(2)}%` : "—"}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className={clsx("text-sm font-mono", h.previous_weight ? "text-gray-800" : "text-gray-300")}>
          {h.previous_weight != null ? `${h.previous_weight.toFixed(2)}%` : "—"}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        {h.status !== "UNCHANGED" && h.status !== "NEW_BUY" && h.status !== "FULL_EXIT" ? (
          <span className={clsx("text-sm font-mono font-semibold", h.change! > 0 ? "text-emerald-600" : "text-red-600")}>
            {h.change! > 0 ? "+" : ""}{h.change?.toFixed(2)}%
          </span>
        ) : (
          <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full border", cfg.bg, cfg.text, cfg.border)}>
            {cfg.label}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function HoldingsTracker() {
  const { data: funds = [] } = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });
  const [selectedFund, setSelectedFund] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const activeFundId = selectedFund ?? funds[0]?.id ?? null;

  const { data: comparison, isLoading } = useQuery({
    queryKey: ["holdings-compare", activeFundId],
    queryFn: () => getHoldingsComparison(activeFundId!),
    enabled: activeFundId != null,
  });

  const filtered = comparison?.changes.filter((c) =>
    filter === "ALL" ? true : c.status === filter
  );

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

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {comparison && (
        <>
          {/* Summary chips */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 text-sm">
                {comparison.fund_name.split("-")[0].trim()}
              </h2>
              <span className="text-xs text-gray-400">
                {comparison.previous_month} → {comparison.current_month}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: "NEW_BUY",   label: "New Buys",    count: comparison.new_buys,   color: "text-emerald-600 bg-emerald-50" },
                { key: "FULL_EXIT", label: "Full Exits",  count: comparison.full_exits,  color: "text-red-600 bg-red-50" },
                { key: "INCREASED", label: "Increased",   count: comparison.increased,   color: "text-blue-600 bg-blue-50" },
                { key: "DECREASED", label: "Decreased",   count: comparison.decreased,   color: "text-amber-600 bg-amber-50" },
                { key: "ALL",       label: "All Holdings", count: comparison.changes.length, color: "text-gray-700 bg-gray-100" },
              ].map(({ key, label, count, color }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    color,
                    filter === key ? "ring-2 ring-offset-1 ring-current" : "opacity-80 hover:opacity-100"
                  )}
                >
                  <span className="font-bold">{count}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock / Sector</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{comparison.current_month}</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{comparison.previous_month}</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((h, i) => <HoldingRow key={i} h={h} />)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
