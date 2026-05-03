import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import HoldingsTracker from "./pages/HoldingsTracker";
import SectorTracker from "./pages/SectorTracker";
import Performance from "./pages/Performance";
import BenchmarkHistory from "./pages/BenchmarkHistory";
import Alerts from "./pages/Alerts";
import News from "./pages/News";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/":           { title: "Dashboard",         subtitle: "Portfolio overview and recent activity" },
  "/portfolio":  { title: "Portfolio",          subtitle: "Manage your mutual fund watchlist" },
  "/holdings":   { title: "Holdings Tracker",   subtitle: "Month-on-month stock holding changes from factsheets" },
  "/sectors":    { title: "Sector Tracker",     subtitle: "Sector allocation shift comparison (current vs previous month)" },
  "/performance":{ title: "Performance",        subtitle: "Returns vs benchmark index and category average" },
  "/benchmarks": { title: "Benchmark History",  subtitle: "5Y / 10Y / 15Y benchmark-beating track record" },
  "/alerts":     { title: "Alerts",             subtitle: "Fund manager changes, category shifts, and more" },
  "/news":       { title: "News Feed",          subtitle: "Aggregated news for every fund in your portfolio" },
};

function Layout() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] ?? { title: "MF Portfolio", subtitle: "" };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/portfolio"   element={<Portfolio />} />
            <Route path="/holdings"    element={<HoldingsTracker />} />
            <Route path="/sectors"     element={<SectorTracker />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/benchmarks"  element={<BenchmarkHistory />} />
            <Route path="/alerts"      element={<Alerts />} />
            <Route path="/news"        element={<News />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
