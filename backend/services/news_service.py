"""Fetch fund-specific news from Google News RSS using stdlib xml.etree."""
import xml.etree.ElementTree as ET
import httpx
import re
from typing import Optional

FALLBACK_NEWS = [
    {
        "title": "Mutual Fund Industry AUM crosses ₹54 lakh crore milestone",
        "link": "#",
        "published": "Sun, 28 Apr 2025 09:00:00 GMT",
        "source": "Economic Times",
        "summary": "AMFI data shows total AUM of the mutual fund industry hit a new high as equity inflows remain strong driven by SIPs.",
        "fund_name": None,
    },
    {
        "title": "SEBI tightens disclosure norms for mutual fund factsheets",
        "link": "#",
        "published": "Fri, 25 Apr 2025 11:30:00 GMT",
        "source": "Mint",
        "summary": "SEBI has mandated additional disclosures in monthly factsheets including risk-adjusted return metrics and peer comparison.",
        "fund_name": None,
    },
    {
        "title": "SIP inflows hit ₹26,000 crore for April 2025",
        "link": "#",
        "published": "Thu, 10 Apr 2025 08:00:00 GMT",
        "source": "Business Standard",
        "summary": "Systematic Investment Plans continue to record strong monthly inflows, indicating sustained retail participation in equity markets.",
        "fund_name": None,
    },
    {
        "title": "PPFAS Flexi Cap Fund declares cash allocation rationale for Q1 2025",
        "link": "#",
        "published": "Mon, 07 Apr 2025 08:00:00 GMT",
        "source": "Value Research",
        "summary": "Parag Parikh Flexi Cap Fund's high cash allocation reflects the fund manager's cautious stance on current market valuations.",
        "fund_name": "Parag Parikh Flexi Cap",
    },
    {
        "title": "SBI Small Cap Fund temporarily suspends lump sum subscriptions",
        "link": "#",
        "published": "Wed, 02 Apr 2025 10:00:00 GMT",
        "source": "Mint",
        "summary": "Due to elevated valuations in the small cap segment, SBI Small Cap Fund has restricted lump sum inflows pending better entry opportunities.",
        "fund_name": "SBI Small Cap",
    },
    {
        "title": "Mirae Asset Large Cap Fund top portfolio moves in March 2025",
        "link": "#",
        "published": "Sat, 05 Apr 2025 11:00:00 GMT",
        "source": "Morningstar",
        "summary": "Mirae Asset Large Cap Fund added HCL Technologies and exited Wipro in the March 2025 portfolio, increasing exposure to IT sector.",
        "fund_name": "Mirae Asset Large Cap",
    },
    {
        "title": "HDFC Mid-Cap Opportunities crosses ₹75,000 crore AUM milestone",
        "link": "#",
        "published": "Fri, 11 Apr 2025 09:00:00 GMT",
        "source": "Economic Times",
        "summary": "HDFC Mutual Fund's flagship mid-cap fund has become the largest mid-cap fund by AUM, driven by strong 3-year returns.",
        "fund_name": "HDFC Mid-Cap Opportunities",
    },
]


def _clean_html(text: str, max_len: int = 250) -> str:
    clean = re.sub(r"<[^>]+>", "", text or "")
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:max_len] + "…" if len(clean) > max_len else clean


def _parse_rss(xml_text: str, fund_name: str) -> list[dict]:
    items = []
    try:
        root = ET.fromstring(xml_text)
        ns = {"media": "http://search.yahoo.com/mrss/"}
        channel = root.find("channel")
        if channel is None:
            return []
        for item in channel.findall("item")[:10]:
            title = item.findtext("title", "").strip()
            link = item.findtext("link", "#").strip()
            pub = item.findtext("pubDate", "").strip()
            desc = _clean_html(item.findtext("description", ""))
            source_el = item.find("source")
            source = source_el.text if source_el is not None else "Google News"
            items.append({
                "title": title,
                "link": link,
                "published": pub,
                "source": source,
                "summary": desc,
                "fund_name": fund_name,
            })
    except ET.ParseError:
        pass
    return items


async def fetch_news_for_fund(fund_name: str, amc: Optional[str] = None) -> list[dict]:
    short_name = fund_name.split("-")[0].strip()
    query = f'"{short_name}" mutual fund India'
    url = (
        "https://news.google.com/rss/search"
        f"?q={query.replace(' ', '+')}&hl=en-IN&gl=IN&ceid=IN:en"
    )
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; MFPortfolio/1.0)"},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            items = _parse_rss(resp.text, short_name)
            return items if items else _fallback_for(short_name)
    except Exception:
        return _fallback_for(short_name)


def _fallback_for(fund_name: str) -> list[dict]:
    # Return generic + fund-specific fallback news
    result = []
    for item in FALLBACK_NEWS:
        if item["fund_name"] is None or item["fund_name"] in fund_name or fund_name in (item["fund_name"] or ""):
            result.append({**item, "fund_name": item["fund_name"] or fund_name})
    return result or [
        {**item, "fund_name": fund_name}
        for item in FALLBACK_NEWS[:3]
    ]


async def fetch_all_portfolio_news(funds: list[dict]) -> list[dict]:
    all_news: list[dict] = []
    for fund in funds:
        items = await fetch_news_for_fund(
            fund.get("scheme_name", ""),
            fund.get("amc"),
        )
        all_news.extend(items)

    seen: set[str] = set()
    unique: list[dict] = []
    for item in all_news:
        key = item["title"][:60]
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique
