import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { user } = useAuth();

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
        <Link to="/alerts" className="relative p-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100">
          <Bell size={20} />
          {data && data.count > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {data.count > 9 ? "9+" : data.count}
            </span>
          )}
        </Link>
        {user && (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
