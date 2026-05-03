from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Fund
from services import amfi_service

router = APIRouter()


# Static routes MUST come before parameterised /{fund_id}/ routes
@router.get("/all/returns")
async def get_all_returns(db: Session = Depends(get_db)):
    funds = db.query(Fund).all()
    results = []
    for fund in funds:
        returns = await amfi_service.compute_returns(fund.scheme_code, fund.inception_date)
        benchmark_key = fund.benchmark or "Nifty 50 TRI"
        cat_key = fund.sub_category or "Large Cap"
        results.append({
            "fund_id": fund.id,
            "scheme_name": fund.scheme_name,
            "sub_category": cat_key,
            "returns": returns,
            "benchmark_returns": amfi_service.BENCHMARK_RETURNS.get(benchmark_key, {}),
            "category_avg_returns": amfi_service.CATEGORY_AVG_RETURNS.get(cat_key, {}),
        })
    return results


@router.get("/all/benchmark-history")
def get_all_benchmark_history(db: Session = Depends(get_db)):
    funds = db.query(Fund).all()
    results = []
    for fund in funds:
        history = amfi_service.BENCHMARK_HISTORY.get(fund.scheme_code, {})
        results.append({
            "fund_id": fund.id,
            "fund_name": fund.scheme_name,
            "benchmark": fund.benchmark,
            "sub_category": fund.sub_category,
            "periods": history,
        })
    return results


@router.get("/{fund_id}/returns")
async def get_returns(fund_id: int, db: Session = Depends(get_db)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    returns = await amfi_service.compute_returns(fund.scheme_code, fund.inception_date)
    benchmark_key = fund.benchmark or "Nifty 50 TRI"
    cat_key = fund.sub_category or "Large Cap"

    return {
        "fund_id": fund_id,
        "scheme_code": fund.scheme_code,
        "scheme_name": fund.scheme_name,
        "returns": returns,
        "benchmark": benchmark_key,
        "benchmark_returns": amfi_service.BENCHMARK_RETURNS.get(benchmark_key, {}),
        "category": cat_key,
        "category_avg_returns": amfi_service.CATEGORY_AVG_RETURNS.get(cat_key, {}),
    }


@router.get("/{fund_id}/nav-history")
async def get_nav_history(fund_id: int, db: Session = Depends(get_db)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    history = await amfi_service.fetch_nav_history(fund.scheme_code)
    return {
        "scheme_code": fund.scheme_code,
        "scheme_name": fund.scheme_name,
        "nav_history": history[:365],
    }


@router.get("/{fund_id}/benchmark-history")
def get_benchmark_history(fund_id: int, db: Session = Depends(get_db)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    history = amfi_service.BENCHMARK_HISTORY.get(fund.scheme_code, {})
    return {
        "fund_id": fund_id,
        "fund_name": fund.scheme_name,
        "benchmark": fund.benchmark,
        "periods": history,
    }
