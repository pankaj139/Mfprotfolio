from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Fund
from services.news_service import fetch_news_for_fund, fetch_all_portfolio_news

router = APIRouter()


@router.get("/{fund_id}")
async def get_fund_news(fund_id: int, db: Session = Depends(get_db)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    items = await fetch_news_for_fund(fund.scheme_name, fund.amc)
    return {"fund_name": fund.scheme_name, "news": items}


@router.get("/")
async def get_all_news(db: Session = Depends(get_db)):
    funds = db.query(Fund).all()
    fund_dicts = [{"scheme_name": f.scheme_name, "amc": f.amc} for f in funds]
    items = await fetch_all_portfolio_news(fund_dicts)
    return {"news": items}
