import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "../../services/api";

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { data } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <a href="/alerts" className="relative p-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100">
          <Bell size={20} />
          {data && data.count > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {data.count > 9 ? "9+" : data.count}
            </span>
          )}
        </a>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
          P
        </div>
      </div>
    </header>
  );
}
