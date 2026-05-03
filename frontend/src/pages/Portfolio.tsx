import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPortfolio, addFund, removeFund, searchFunds } from "../services/api";
import { Search, Plus, Trash2, User, Calendar, Target, Info } from "lucide-react";
import clsx from "clsx";

export default function Portfolio() {
  const qc = useQueryClient();
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ schemeCode: number; schemeName: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: funds = [], isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
  });

  const removeMut = useMutation({
    mutationFn: removeFund,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });

  const addMut = useMutation({
    mutationFn: (item: { schemeCode: number; schemeName: string }) =>
      addFund({
        scheme_code: String(item.schemeCode),
        scheme_name: item.schemeName,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setSearchResults([]);
      setSearchQ("");
    },
  });

  const handleSearch = async () => {
    if (searchQ.length < 3) return;
    setSearching(true);
    const results = await searchFunds(searchQ);
    setSearchResults(results);
    setSearching(false);
  };

  const categoryBadge = (cat: string | null) => {
    const colors: Record<string, string> = {
      "Large Cap": "bg-blue-50 text-blue-700",
      "Flexi Cap": "bg-purple-50 text-purple-700",
      "Mid Cap": "bg-amber-50 text-amber-700",
      "Small Cap": "bg-orange-50 text-orange-700",
    };
    return colors[cat ?? ""] ?? "bg-gray-100 text-gray-600";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add fund */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Search size={16} className="text-blue-600" /> Add Fund to Portfolio
        </h2>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by fund name or scheme code…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn-primary flex items-center gap-1.5" onClick={handleSearch} disabled={searching}>
            {searching ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto">
            {searchResults.map((item) => {
              const alreadyAdded = funds.some((f) => f.scheme_code === String(item.schemeCode));
              return (
                <div key={item.schemeCode} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.schemeName}</p>
                    <p className="text-xs text-gray-400">Code: {item.schemeCode}</p>
                  </div>
                  <button
                    className={clsx(
                      "flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg",
                      alreadyAdded
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                    disabled={alreadyAdded || addMut.isPending}
                    onClick={() => addMut.mutate(item)}
                  >
                    <Plus size={12} />
                    {alreadyAdded ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fund list */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">
          Your Portfolio ({funds.length} funds)
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {funds.map((fund) => (
              <div key={fund.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 text-sm leading-snug">
                        {fund.scheme_name}
                      </h3>
                      <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", categoryBadge(fund.sub_category))}>
                        {fund.sub_category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{fund.amc}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <button
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      onClick={() => setExpandedId(expandedId === fund.id ? null : fund.id)}
                    >
                      <Info size={15} />
                    </button>
                    <button
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Remove "${fund.scheme_name}" from portfolio?`)) {
                          removeMut.mutate(fund.id);
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {expandedId === fund.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Target size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Benchmark</p>
                        <p className="text-gray-700 font-medium">{fund.benchmark ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Fund Manager</p>
                        <p className="text-gray-700 font-medium">{fund.fund_manager ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Inception Date</p>
                        <p className="text-gray-700 font-medium">{fund.inception_date ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Search size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">AMFI Code</p>
                        <p className="text-gray-700 font-medium">{fund.scheme_code}</p>
                      </div>
                    </div>
                    {fund.objective && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Investment Objective</p>
                        <p className="text-gray-600 text-xs leading-relaxed">{fund.objective}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
