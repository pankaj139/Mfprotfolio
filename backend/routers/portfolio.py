from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Fund
from schemas import FundOut, FundCreate
from services import amfi_service

router = APIRouter()


@router.get("/", response_model=list[FundOut])
def list_portfolio(db: Session = Depends(get_db)):
    return db.query(Fund).order_by(Fund.added_at).all()


@router.post("/", response_model=FundOut, status_code=201)
def add_fund(fund_data: FundCreate, db: Session = Depends(get_db)):
    existing = db.query(Fund).filter(Fund.scheme_code == fund_data.scheme_code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Fund already in portfolio")
    fund = Fund(**fund_data.model_dump())
    db.add(fund)
    db.commit()
    db.refresh(fund)
    return fund


@router.delete("/{fund_id}", status_code=204)
def remove_fund(fund_id: int, db: Session = Depends(get_db)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    db.delete(fund)
    db.commit()


@router.get("/search")
async def search_funds(q: str):
    if not q or len(q) < 3:
        return []
    results = await amfi_service.search_funds(q)
    return results[:20]


@router.get("/{fund_id}", response_model=FundOut)
def get_fund(fund_id: int, db: Session = Depends(get_db)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return fund
