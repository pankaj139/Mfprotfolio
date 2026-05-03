export interface Fund {
  id: number;
  scheme_code: string;
  scheme_name: string;
  amc: string | null;
  category: string | null;
  sub_category: string | null;
  benchmark: string | null;
  fund_manager: string | null;
  inception_date: string | null;
  objective: string | null;
  isin_growth: string | null;
  added_at: string;
}

export interface HoldingChange {
  stock_name: string;
  sector: string | null;
  current_weight: number | null;
  previous_weight: number | null;
  change: number | null;
  status: "NEW_BUY" | "FULL_EXIT" | "INCREASED" | "DECREASED" | "UNCHANGED";
}

export interface HoldingsComparison {
  fund_id: number;
  fund_name: string;
  current_month: string;
  previous_month: string;
  changes: HoldingChange[];
  new_buys: number;
  full_exits: number;
  increased: number;
  decreased: number;
}

export interface SectorChange {
  sector_name: string;
  current_weight: number | null;
  previous_weight: number | null;
  change: number | null;
  status: "INCREASED" | "DECREASED" | "NEW" | "EXITED" | "UNCHANGED";
}

export interface SectorComparison {
  fund_id: number;
  fund_name: string;
  current_month: string;
  previous_month: string;
  changes: SectorChange[];
  threshold: number;
}

export interface Alert {
  id: number;
  fund_id: number;
  fund_name: string | null;
  alert_type: string;
  title: string;
  message: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  is_read: boolean;
  created_at: string;
}

export interface PerformanceReturns {
  fund_id: number;
  scheme_code: string;
  scheme_name: string;
  returns: {
    "1y"?: number;
    "3y"?: number;
    "5y"?: number;
    since_inception?: number;
  };
  benchmark: string;
  benchmark_returns: Record<string, number>;
  category: string;
  category_avg_returns: Record<string, number>;
}

export interface BenchmarkPeriod {
  fund: number | null;
  benchmark: number | null;
  outperformed: boolean | null;
}

export interface BenchmarkHistory {
  fund_id: number;
  fund_name: string;
  benchmark: string;
  periods: {
    "5y"?: BenchmarkPeriod;
    "10y"?: BenchmarkPeriod;
    "15y"?: BenchmarkPeriod;
  };
}

export interface NewsItem {
  title: string;
  link: string;
  published: string | null;
  source: string | null;
  summary: string | null;
  fund_name: string | null;
}

export interface DashboardSummary {
  total_funds: number;
  unread_alerts: number;
  severity_counts: Record<string, number>;
  type_counts: Record<string, number>;
  funds: Fund[];
}
