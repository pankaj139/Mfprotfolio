"""Seed service — populates demo portfolio with realistic Indian mutual fund data."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Fund, HoldingSnapshot, SectorSnapshot, Alert, FundMetadata


DEMO_FUNDS = [
    {
        "scheme_code": "119551",
        "scheme_name": "Mirae Asset Large Cap Fund - Direct Plan - Growth",
        "amc": "Mirae Asset Mutual Fund",
        "category": "Equity",
        "sub_category": "Large Cap",
        "benchmark": "Nifty 100 TRI",
        "fund_manager": "Gaurav Misra",
        "inception_date": "2010-04-04",
        "objective": "The investment objective of the scheme is to generate long term capital appreciation by investing predominantly in equity and equity related instruments of large cap companies.",
        "isin_growth": "INF769K01EW9",
    },
    {
        "scheme_code": "122639",
        "scheme_name": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
        "amc": "PPFAS Mutual Fund",
        "category": "Equity",
        "sub_category": "Flexi Cap",
        "benchmark": "Nifty 500 TRI",
        "fund_manager": "Rajeev Thakkar",
        "inception_date": "2013-05-13",
        "objective": "The investment objective of the scheme is to seek to generate long-term capital growth from an actively managed portfolio primarily of equity and equity related securities.",
        "isin_growth": "INF879O01027",
    },
    {
        "scheme_code": "120503",
        "scheme_name": "Axis Bluechip Fund - Direct Plan - Growth",
        "amc": "Axis Mutual Fund",
        "category": "Equity",
        "sub_category": "Large Cap",
        "benchmark": "Nifty 50 TRI",
        "fund_manager": "Shreyash Devalkar",
        "inception_date": "2010-01-05",
        "objective": "To achieve long term capital appreciation by investing in a diversified portfolio predominantly consisting of equity and equity related securities of large cap companies.",
        "isin_growth": "INF846K01DP8",
    },
    {
        "scheme_code": "118560",
        "scheme_name": "HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth",
        "amc": "HDFC Mutual Fund",
        "category": "Equity",
        "sub_category": "Mid Cap",
        "benchmark": "Nifty Midcap 150 TRI",
        "fund_manager": "Chirag Setalvad",
        "inception_date": "2007-06-25",
        "objective": "To provide long-term capital appreciation/income by investing predominantly in Mid-Cap companies.",
        "isin_growth": "INF179K01VN9",
    },
    {
        "scheme_code": "125494",
        "scheme_name": "SBI Small Cap Fund - Direct Plan - Growth",
        "amc": "SBI Funds Management",
        "category": "Equity",
        "sub_category": "Small Cap",
        "benchmark": "Nifty Smallcap 250 TRI",
        "fund_manager": "R. Srinivasan",
        "inception_date": "2009-09-09",
        "objective": "To provide investors with opportunities for long-term growth in capital by investing predominantly in a well-diversified basket of equity stocks of small cap companies.",
        "isin_growth": "INF200K01UC7",
    },
]

# Holdings data: (stock_name, sector, weight_march, weight_feb)
# weight=None means not present that month
HOLDINGS_DATA = {
    "119551": [  # Mirae Asset Large Cap
        ("HDFC Bank Ltd", "Financial Services", 9.20, 9.50),
        ("Reliance Industries Ltd", "Oil Gas & Consumable Fuels", 8.50, 8.80),
        ("ICICI Bank Ltd", "Financial Services", 7.80, 7.60),
        ("Infosys Ltd", "Information Technology", 6.20, 5.90),
        ("Tata Consultancy Services Ltd", "Information Technology", 5.10, 5.10),
        ("Larsen & Toubro Ltd", "Industrials", 4.30, 4.10),
        ("Axis Bank Ltd", "Financial Services", 3.80, 3.80),
        ("Bajaj Finance Ltd", "Financial Services", 3.20, 3.50),
        ("Kotak Mahindra Bank Ltd", "Financial Services", 2.90, 2.90),
        ("State Bank of India", "Financial Services", 2.50, 2.70),
        ("HCL Technologies Ltd", "Information Technology", 2.30, None),  # NEW BUY
        ("Bharti Airtel Ltd", "Telecom", 2.10, 2.10),
        ("Sun Pharmaceutical Industries Ltd", "Healthcare", 1.90, 2.00),
        ("Hindustan Unilever Ltd", "Consumer Staples", 1.80, 1.80),
        ("ITC Ltd", "Consumer Staples", 1.70, 1.90),
        ("Titan Company Ltd", "Consumer Discretionary", 1.50, 1.50),
        ("Maruti Suzuki India Ltd", "Consumer Discretionary", 1.40, 1.40),
        ("Nestle India Ltd", "Consumer Staples", 1.20, 1.20),
        ("Power Grid Corporation of India Ltd", "Utilities", 1.10, 1.10),
        ("Wipro Ltd", "Information Technology", None, 1.50),  # FULL EXIT
    ],
    "122639": [  # PPFAS Flexi Cap
        ("HDFC Bank Ltd", "Financial Services", 5.50, 5.20),
        ("ITC Ltd", "Consumer Staples", 4.80, 4.80),
        ("Bajaj Holdings & Investment Ltd", "Financial Services", 4.20, 4.00),
        ("Power Grid Corporation of India Ltd", "Utilities", 3.90, 4.20),
        ("Coal India Ltd", "Energy", 3.50, 3.50),
        ("HCL Technologies Ltd", "Information Technology", 3.20, 3.20),
        ("Microsoft Corporation", "Information Technology", 2.80, 2.60),
        ("Alphabet Inc Class A", "Communication Services", 2.50, 2.50),
        ("Amazon.com Inc", "Consumer Discretionary", 2.20, 2.40),
        ("Meta Platforms Inc", "Communication Services", 1.90, 1.70),
        ("ICICI Bank Ltd", "Financial Services", 3.10, 2.80),
        ("Motilal Oswal Financial Services Ltd", "Financial Services", 2.70, 2.70),
        ("Indian Energy Exchange Ltd", "Energy", 2.10, 2.30),
        ("Persistent Systems Ltd", "Information Technology", 1.80, None),  # NEW BUY
        ("Dr. Reddy's Laboratories Ltd", "Healthcare", 1.60, 1.90),
        ("Tube Investments of India Ltd", "Industrials", None, 1.50),  # FULL EXIT
    ],
    "120503": [  # Axis Bluechip
        ("Bajaj Finance Ltd", "Financial Services", 7.80, 7.50),
        ("HDFC Bank Ltd", "Financial Services", 7.20, 7.20),
        ("Avenue Supermarts Ltd", "Consumer Discretionary", 5.90, 6.20),
        ("Tata Consultancy Services Ltd", "Information Technology", 5.50, 5.50),
        ("Infosys Ltd", "Information Technology", 5.20, 4.80),
        ("Kotak Mahindra Bank Ltd", "Financial Services", 4.80, 5.00),
        ("ICICI Bank Ltd", "Financial Services", 4.50, 4.30),
        ("Asian Paints Ltd", "Materials", 4.10, 4.10),
        ("Titan Company Ltd", "Consumer Discretionary", 3.80, 4.00),
        ("Pidilite Industries Ltd", "Materials", 3.50, 3.50),
        ("Divi's Laboratories Ltd", "Healthcare", 3.20, 3.20),
        ("Torrent Pharmaceuticals Ltd", "Healthcare", 2.90, None),  # NEW BUY
        ("Siemens Ltd", "Industrials", 2.70, 2.70),
        ("Maruti Suzuki India Ltd", "Consumer Discretionary", None, 2.50),  # FULL EXIT
        ("Page Industries Ltd", "Consumer Discretionary", 2.40, 2.20),
    ],
    "118560": [  # HDFC Mid-Cap
        ("Persistent Systems Ltd", "Information Technology", 3.20, 3.00),
        ("Supreme Industries Ltd", "Industrials", 2.80, 2.80),
        ("The Indian Hotels Company Ltd", "Consumer Discretionary", 2.50, 2.30),
        ("Coforge Ltd", "Information Technology", 2.30, 2.50),
        ("Max Healthcare Institute Ltd", "Healthcare", 2.10, 2.10),
        ("Cholamandalam Investment & Finance", "Financial Services", 2.00, 1.80),
        ("PI Industries Ltd", "Chemicals", 1.90, 2.00),
        ("Crompton Greaves Consumer Electricals", "Consumer Discretionary", 1.80, 1.80),
        ("Navin Fluorine International Ltd", "Chemicals", 1.70, None),  # NEW BUY
        ("Mphasis Ltd", "Information Technology", 1.60, 1.70),
        ("Astral Ltd", "Industrials", 1.50, 1.50),
        ("Blue Dart Express Ltd", "Industrials", 1.40, 1.60),
        ("Sona BLW Precision Forgings Ltd", "Industrials", None, 1.40),  # FULL EXIT
        ("Varun Beverages Ltd", "Consumer Staples", 1.30, 1.30),
        ("Can Fin Homes Ltd", "Financial Services", 1.20, 1.20),
    ],
    "125494": [  # SBI Small Cap
        ("Finolex Industries Ltd", "Industrials", 2.80, 2.80),
        ("Chalet Hotels Ltd", "Consumer Discretionary", 2.50, 2.20),
        ("Blue Star Ltd", "Consumer Discretionary", 2.30, 2.30),
        ("Nuvoco Vistas Corporation Ltd", "Materials", 2.10, 2.30),
        ("Craftsman Automation Ltd", "Industrials", 1.90, None),  # NEW BUY
        ("Techno Electric & Engineering Co", "Industrials", 1.80, 1.80),
        ("Safari Industries India Ltd", "Consumer Discretionary", 1.70, 1.70),
        ("Krishna Institute of Medical Sciences", "Healthcare", 1.60, 1.60),
        ("Elgi Equipments Ltd", "Industrials", 1.50, 1.70),
        ("Greenpanel Industries Ltd", "Materials", 1.40, 1.40),
        ("Garware Technical Fibres Ltd", "Materials", None, 1.60),  # FULL EXIT
        ("PNC Infratech Ltd", "Industrials", 1.30, 1.30),
        ("Aavas Financiers Ltd", "Financial Services", 1.20, 1.10),
        ("Dixon Technologies India Ltd", "Information Technology", 1.10, 1.00),
        ("Shyam Metalics & Energy Ltd", "Materials", 1.00, 1.00),
    ],
}

# Sector data: (sector_name, march_weight, feb_weight)
SECTOR_DATA = {
    "119551": [  # Mirae Asset Large Cap
        ("Financial Services", 35.50, 34.00),
        ("Information Technology", 15.20, 14.60),
        ("Oil Gas & Consumable Fuels", 10.50, 10.80),
        ("Consumer Discretionary", 8.30, 8.30),
        ("Healthcare", 6.80, 7.00),
        ("Industrials", 6.20, 6.00),
        ("Consumer Staples", 5.50, 5.70),
        ("Telecom", 3.80, 3.80),
        ("Utilities", 4.10, 4.10),
        ("Materials", 4.10, 5.70),
    ],
    "122639": [  # PPFAS Flexi Cap
        ("Financial Services", 18.60, 17.90),
        ("Information Technology", 10.10, 9.60),
        ("Consumer Staples", 7.80, 7.80),
        ("Utilities", 6.80, 7.20),
        ("Energy", 6.50, 6.50),
        ("Communication Services", 5.90, 5.60),
        ("Consumer Discretionary", 5.20, 5.60),
        ("Healthcare", 4.60, 4.90),
        ("Industrials", 3.60, 4.50),
        ("Cash & Equivalents", 30.90, 30.40),
    ],
    "120503": [  # Axis Bluechip
        ("Financial Services", 28.50, 29.00),
        ("Information Technology", 16.80, 16.10),
        ("Consumer Discretionary", 14.60, 15.10),
        ("Materials", 8.70, 8.70),
        ("Healthcare", 6.10, 3.20),
        ("Industrials", 5.80, 5.80),
        ("Consumer Staples", 4.50, 4.50),
        ("Utilities", 3.20, 3.20),
        ("Cash & Equivalents", 11.80, 14.40),
    ],
    "118560": [  # HDFC Mid-Cap
        ("Financial Services", 16.80, 15.60),
        ("Information Technology", 14.20, 14.30),
        ("Consumer Discretionary", 12.50, 13.20),
        ("Industrials", 11.80, 12.50),
        ("Healthcare", 9.40, 9.40),
        ("Chemicals", 8.30, 9.40),
        ("Consumer Staples", 5.20, 5.20),
        ("Materials", 4.80, 4.80),
        ("Utilities", 3.50, 3.50),
        ("Cash & Equivalents", 13.50, 12.10),
    ],
    "125494": [  # SBI Small Cap
        ("Industrials", 22.40, 22.10),
        ("Consumer Discretionary", 14.80, 14.00),
        ("Materials", 13.60, 14.50),
        ("Healthcare", 10.20, 10.20),
        ("Information Technology", 8.30, 7.80),
        ("Financial Services", 7.60, 7.60),
        ("Consumer Staples", 5.10, 5.10),
        ("Chemicals", 4.80, 4.80),
        ("Utilities", 3.20, 3.20),
        ("Cash & Equivalents", 10.00, 10.70),
    ],
}

ALERT_SEEDS = [
    {
        "scheme_code": "120503",  # Axis Bluechip
        "alert_type": "FUND_MANAGER_CHANGE",
        "title": "Fund Manager Change — Axis Bluechip Fund",
        "message": "Axis Bluechip Fund has appointed Ashish Naik as co-fund manager alongside Shreyash Devalkar effective 15 March 2025. Devalkar continues as lead manager.",
        "severity": "HIGH",
        "days_ago": 18,
    },
    {
        "scheme_code": "122639",  # PPFAS
        "alert_type": "ASSET_ALLOCATION_CHANGE",
        "title": "High Cash Allocation — Parag Parikh Flexi Cap",
        "message": "Cash & equivalents allocation has risen to 30.9% (threshold: 25%). This indicates the fund manager is taking a cautious stance amid elevated market valuations.",
        "severity": "MEDIUM",
        "days_ago": 5,
    },
    {
        "scheme_code": "119551",  # Mirae Large Cap
        "alert_type": "SECTOR_SHIFT",
        "title": "Sector Reallocation — Mirae Asset Large Cap",
        "message": "Financial Services allocation increased by +1.5% (from 34.0% to 35.5%) while Materials sector decreased by −1.6% (from 5.7% to 4.1%) in the March 2025 factsheet.",
        "severity": "LOW",
        "days_ago": 3,
    },
    {
        "scheme_code": "125494",  # SBI Small Cap
        "alert_type": "FUND_OBJECTIVE_CHANGE",
        "title": "Investment Objective Amended — SBI Small Cap Fund",
        "message": "SBI Small Cap Fund has updated its investment objective to include selective exposure to micro-cap companies (market cap below ₹500 crore) up to 10% of the portfolio, effective April 2025.",
        "severity": "HIGH",
        "days_ago": 12,
    },
    {
        "scheme_code": "118560",  # HDFC Mid-Cap
        "alert_type": "CATEGORY_CHANGE",
        "title": "Sub-Category Clarification — HDFC Mid-Cap Opportunities",
        "message": "SEBI has issued a clarification that HDFC Mid-Cap Opportunities Fund's mandate for up to 35% in large-cap stocks remains unchanged. No reclassification has occurred.",
        "severity": "LOW",
        "days_ago": 7,
        "is_read": True,
    },
    {
        "scheme_code": "119551",
        "alert_type": "HOLDINGS_CHANGE",
        "title": "New Stock Entry — HCL Technologies",
        "message": "HCL Technologies Ltd (IT sector) was newly added to Mirae Asset Large Cap Fund portfolio in March 2025 with a 2.3% weightage. Simultaneously, Wipro Ltd was fully exited.",
        "severity": "MEDIUM",
        "days_ago": 3,
    },
]


def seed_database(db: Session) -> None:
    if db.query(Fund).first():
        return  # Already seeded

    fund_map: dict[str, Fund] = {}
    for fd in DEMO_FUNDS:
        fund = Fund(**fd)
        db.add(fund)
        db.flush()
        fund_map[fd["scheme_code"]] = fund

        db.add(FundMetadata(
            fund_id=fund.id,
            category=fd["category"],
            sub_category=fd["sub_category"],
            fund_manager=fd["fund_manager"],
            objective=fd["objective"],
            benchmark=fd["benchmark"],
            asset_equity=95.0 if fd["sub_category"] in ("Large Cap", "Mid Cap", "Small Cap") else 70.0,
            asset_debt=0.0,
            asset_cash=5.0,
        ))

    current_month = "2025-03"
    prev_month = "2025-02"

    for code, holdings in HOLDINGS_DATA.items():
        fund = fund_map[code]
        for stock_name, sector, w_curr, w_prev in holdings:
            if w_curr is not None:
                db.add(HoldingSnapshot(
                    fund_id=fund.id,
                    snapshot_month=current_month,
                    stock_name=stock_name,
                    sector=sector,
                    weightage=w_curr,
                ))
            if w_prev is not None:
                db.add(HoldingSnapshot(
                    fund_id=fund.id,
                    snapshot_month=prev_month,
                    stock_name=stock_name,
                    sector=sector,
                    weightage=w_prev,
                ))

    for code, sectors in SECTOR_DATA.items():
        fund = fund_map[code]
        for sector_name, w_curr, w_prev in sectors:
            db.add(SectorSnapshot(
                fund_id=fund.id,
                snapshot_month=current_month,
                sector_name=sector_name,
                weightage=w_curr,
            ))
            db.add(SectorSnapshot(
                fund_id=fund.id,
                snapshot_month=prev_month,
                sector_name=sector_name,
                weightage=w_prev,
            ))

    for alert_data in ALERT_SEEDS:
        code = alert_data["scheme_code"]
        fund = fund_map.get(code)
        if not fund:
            continue
        created = datetime.utcnow() - timedelta(days=alert_data["days_ago"])
        db.add(Alert(
            fund_id=fund.id,
            alert_type=alert_data["alert_type"],
            title=alert_data["title"],
            message=alert_data["message"],
            severity=alert_data["severity"],
            is_read=alert_data.get("is_read", False),
            created_at=created,
        ))

    db.commit()
