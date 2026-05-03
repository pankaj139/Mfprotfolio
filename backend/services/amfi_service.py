"""Fetch NAV history and compute returns from the free mfapi.in API."""
import httpx
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from typing import Optional

MFAPI_BASE = "https://api.mfapi.in/mf"

# Simulated benchmark + category returns (since live index data requires paid APIs)
BENCHMARK_RETURNS: dict[str, dict[str, float]] = {
    "Nifty 50 TRI":        {"1y": 14.2, "3y": 13.8, "5y": 15.6, "since_inception": 14.1},
    "Nifty 100 TRI":       {"1y": 13.5, "3y": 13.2, "5y": 15.1, "since_inception": 13.8},
    "Nifty 500 TRI":       {"1y": 12.8, "3y": 14.6, "5y": 16.2, "since_inception": 14.5},
    "Nifty Midcap 150 TRI":{"1y": 15.3, "3y": 20.1, "5y": 22.4, "since_inception": 18.6},
    "Nifty Smallcap 250 TRI":{"1y": 10.5,"3y": 21.8, "5y": 24.1, "since_inception": 17.2},
}

CATEGORY_AVG_RETURNS: dict[str, dict[str, float]] = {
    "Large Cap":   {"1y": 13.9, "3y": 13.5, "5y": 15.3},
    "Flexi Cap":   {"1y": 14.2, "3y": 15.8, "5y": 17.4},
    "Mid Cap":     {"1y": 14.8, "3y": 18.9, "5y": 21.6},
    "Small Cap":   {"1y": 11.2, "3y": 20.4, "5y": 22.9},
}

# Benchmark beating history (simulated for 5Y / 10Y / 15Y)
BENCHMARK_HISTORY: dict[str, dict] = {
    "119551": {  # Mirae Large Cap
        "5y":  {"fund": 16.2, "benchmark": 15.1, "outperformed": True},
        "10y": {"fund": 15.8, "benchmark": 13.8, "outperformed": True},
        "15y": {"fund": None, "benchmark": None, "outperformed": None},  # not old enough
    },
    "122639": {  # PPFAS Flexi Cap
        "5y":  {"fund": 20.4, "benchmark": 16.2, "outperformed": True},
        "10y": {"fund": 18.6, "benchmark": 14.5, "outperformed": True},
        "15y": {"fund": None, "benchmark": None, "outperformed": None},
    },
    "120503": {  # Axis Bluechip
        "5y":  {"fund": 14.1, "benchmark": 15.6, "outperformed": False},
        "10y": {"fund": 14.8, "benchmark": 14.1, "outperformed": True},
        "15y": {"fund": 13.9, "benchmark": 12.8, "outperformed": True},
    },
    "118560": {  # HDFC Mid-Cap
        "5y":  {"fund": 24.6, "benchmark": 22.4, "outperformed": True},
        "10y": {"fund": 22.1, "benchmark": 18.6, "outperformed": True},
        "15y": {"fund": 20.3, "benchmark": 16.9, "outperformed": True},
    },
    "125494": {  # SBI Small Cap
        "5y":  {"fund": 26.8, "benchmark": 24.1, "outperformed": True},
        "10y": {"fund": 21.5, "benchmark": 17.2, "outperformed": True},
        "15y": {"fund": 19.8, "benchmark": 15.1, "outperformed": True},
    },
}


def _cagr(start_nav: float, end_nav: float, years: float) -> float:
    if start_nav <= 0 or years <= 0:
        return 0.0
    return round(((end_nav / start_nav) ** (1.0 / years) - 1) * 100, 2)


async def fetch_nav_history(scheme_code: str) -> list[dict]:
    url = f"{MFAPI_BASE}/{scheme_code}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])
    except Exception:
        return []


async def compute_returns(scheme_code: str, inception_date: Optional[str] = None) -> dict:
    nav_history = await fetch_nav_history(scheme_code)

    if not nav_history:
        return {}

    # nav_history is newest-first list of {"date": "DD-MM-YYYY", "nav": "123.45"}
    try:
        latest_nav = float(nav_history[0]["nav"])
        latest_date_str = nav_history[0]["date"]
        latest_date = datetime.strptime(latest_date_str, "%d-%m-%Y").date()
    except (KeyError, ValueError, IndexError):
        return {}

    def nav_on_or_before(target: date) -> Optional[float]:
        for entry in nav_history:
            try:
                d = datetime.strptime(entry["date"], "%d-%m-%Y").date()
                if d <= target:
                    return float(entry["nav"])
            except (ValueError, KeyError):
                continue
        return None

    result: dict[str, Optional[float]] = {}

    for years, key in [(1, "1y"), (3, "3y"), (5, "5y")]:
        target = latest_date - relativedelta(years=years)
        past_nav = nav_on_or_before(target)
        if past_nav:
            result[key] = _cagr(past_nav, latest_nav, years)
        else:
            result[key] = None

    # Since inception
    if inception_date:
        try:
            inc_date = datetime.strptime(inception_date, "%Y-%m-%d").date()
            years_since = (latest_date - inc_date).days / 365.25
            inc_nav = nav_on_or_before(inc_date + relativedelta(days=7))  # first few days
            if inc_nav and years_since > 0:
                result["since_inception"] = _cagr(inc_nav, latest_nav, years_since)
            else:
                result["since_inception"] = None
        except ValueError:
            result["since_inception"] = None
    else:
        result["since_inception"] = None

    return result


async def search_funds(query: str) -> list[dict]:
    """Search AMFI fund list."""
    url = "https://api.mfapi.in/mf/search"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"q": query})
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return []
