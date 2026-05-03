import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  PieChart,
  TrendingUp,
  Award,
  Bell,
  Newspaper,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { to: "/",            icon: LayoutDashboard, label: "Dashboard" },
  { to: "/portfolio",   icon: Briefcase,       label: "Portfolio" },
  { to: "/holdings",    icon: BarChart3,        label: "Holdings Tracker" },
  { to: "/sectors",     icon: PieChart,         label: "Sector Tracker" },
  { to: "/performance", icon: TrendingUp,       label: "Performance" },
  { to: "/benchmarks",  icon: Award,            label: "Benchmark History" },
  { to: "/alerts",      icon: Bell,             label: "Alerts" },
  { to: "/news",        icon: Newspaper,        label: "News Feed" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="hidden md:flex flex-col w-60 bg-gray-900 text-white min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
            MF
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Portfolio Intelligence</p>
            <p className="text-gray-400 text-xs">Mutual Fund Monitor</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User & logout */}
      <div className="px-4 py-4 border-t border-gray-700">
        {user && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
        <p className="text-xs text-gray-600 mt-3">Data: AMFI · Value Research · Google News</p>
      </div>
    </aside>
  );
}
