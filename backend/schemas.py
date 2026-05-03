from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FundBase(BaseModel):
    scheme_code: str
    scheme_name: str
    amc: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    benchmark: Optional[str] = None
    fund_manager: Optional[str] = None
    inception_date: Optional[str] = None
    objective: Optional[str] = None
    isin_growth: Optional[str] = None


class FundCreate(FundBase):
    pass


class FundOut(FundBase):
    id: int
    added_at: datetime

    model_config = {"from_attributes": True}


class HoldingSnapshotOut(BaseModel):
    id: int
    fund_id: int
    snapshot_month: str
    stock_name: str
    sector: Optional[str]
    weightage: float

    model_config = {"from_attributes": True}


class HoldingChange(BaseModel):
    stock_name: str
    sector: Optional[str]
    current_weight: Optional[float]
    previous_weight: Optional[float]
    change: Optional[float]
    status: str  # NEW_BUY, FULL_EXIT, INCREASED, DECREASED, UNCHANGED


class HoldingsComparisonOut(BaseModel):
    fund_id: int
    fund_name: str
    current_month: str
    previous_month: str
    changes: list[HoldingChange]
    new_buys: int
    full_exits: int
    increased: int
    decreased: int


class SectorSnapshotOut(BaseModel):
    id: int
    fund_id: int
    snapshot_month: str
    sector_name: str
    weightage: float

    model_config = {"from_attributes": True}


class SectorChange(BaseModel):
    sector_name: str
    current_weight: Optional[float]
    previous_weight: Optional[float]
    change: Optional[float]
    status: str  # INCREASED, DECREASED, NEW, EXITED, UNCHANGED


class SectorComparisonOut(BaseModel):
    fund_id: int
    fund_name: str
    current_month: str
    previous_month: str
    changes: list[SectorChange]
    threshold: float


class AlertOut(BaseModel):
    id: int
    fund_id: int
    fund_name: Optional[str] = None
    alert_type: str
    title: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FundMetadataOut(BaseModel):
    id: int
    fund_id: int
    category: Optional[str]
    sub_category: Optional[str]
    fund_manager: Optional[str]
    objective: Optional[str]
    benchmark: Optional[str]
    asset_equity: Optional[float]
    asset_debt: Optional[float]
    asset_cash: Optional[float]
    recorded_at: datetime

    model_config = {"from_attributes": True}


class PerformanceData(BaseModel):
    scheme_code: str
    scheme_name: str
    returns_1y: Optional[float]
    returns_3y: Optional[float]
    returns_5y: Optional[float]
    returns_since_inception: Optional[float]
    category_avg_1y: Optional[float]
    category_avg_3y: Optional[float]
    category_avg_5y: Optional[float]
    benchmark_1y: Optional[float]
    benchmark_3y: Optional[float]
    benchmark_5y: Optional[float]


class BenchmarkHistoryOut(BaseModel):
    fund_id: int
    fund_name: str
    benchmark: str
    period_5y: Optional[dict]
    period_10y: Optional[dict]
    period_15y: Optional[dict]


class NewsItem(BaseModel):
    title: str
    link: str
    published: Optional[str]
    source: Optional[str]
    summary: Optional[str]
    fund_name: Optional[str]


class DashboardSummary(BaseModel):
    total_funds: int
    unread_alerts: int
    alert_breakdown: dict
    funds: list[FundOut]
