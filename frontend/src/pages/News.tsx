import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPortfolio, getAllNews, getFundNews } from "../services/api";
import { Newspaper, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import clsx from "clsx";
import type { NewsItem } from "../types";

function NewsCard({ item }: { item: NewsItem }) {
  const parsedDate = (() => {
    try {
      if (!item.published) return null;
      const d = new Date(item.published);
      return isValid(d) ? d : null;
    } catch {
      return null;
    }
  })();

  return (
    <a
      href={item.link !== "#" ? item.link : undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "card block hover:shadow-md transition-shadow group",
        item.link === "#" && "cursor-default"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {item.fund_name && (
              <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                {item.fund_name}
              </span>
            )}
            {item.source && (
              <span className="text-xs text-gray-400">{item.source}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 leading-snug">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
              {item.summary}
            </p>
          )}
          {parsedDate && (
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
              <Clock size={10} />
              {format(parsedDate, "d MMM yyyy, hh:mm a")}
            </p>
          )}
        </div>
        {item.link !== "#" && (
          <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1" />
        )}
      </div>
    </a>
  );
}

export default function News() {
  const { data: funds = [] } = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });
  const [selectedFundId, setSelectedFundId] = useState<number | null>(null);

  const { data: allNewsData, isLoading: allLoading, refetch: refetchAll } = useQuery({
    queryKey: ["all-news"],
    queryFn: getAllNews,
    enabled: selectedFundId === null,
    staleTime: 5 * 60_000,
  });

  const { data: fundNewsData, isLoading: fundLoading } = useQuery({
    queryKey: ["fund-news", selectedFundId],
    queryFn: () => getFundNews(selectedFundId!),
    enabled: selectedFundId !== null,
    staleTime: 5 * 60_000,
  });

  const isLoading = selectedFundId === null ? allLoading : fundLoading;
  const newsItems: NewsItem[] = selectedFundId === null
    ? (allNewsData?.news ?? [])
    : (fundNewsData?.news ?? []);

  return (
    <div className="p-6 space-y-5">
      {/* Fund filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setSelectedFundId(null)}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            selectedFundId === null
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
          )}
        >
          All Funds
        </button>
        {funds.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFundId(f.id)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              selectedFundId === f.id
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
            )}
          >
            {f.scheme_name.split("-")[0].trim()}
          </button>
        ))}
        <button
          onClick={() => refetchAll()}
          className="ml-auto p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
          title="Refresh news"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : newsItems.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Newspaper size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No news found</p>
          <p className="text-sm mt-1">Try refreshing or check your connection.</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 mb-3">{newsItems.length} articles — sourced via Google News RSS</p>
          <div className="grid md:grid-cols-2 gap-4">
            {newsItems.map((item, i) => <NewsCard key={i} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );
}
