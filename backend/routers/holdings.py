from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Fund, HoldingSnapshot
from schemas import HoldingsComparisonOut, HoldingChange

router = APIRouter()


@router.get("/{fund_id}/compare", response_model=HoldingsComparisonOut)
def compare_holdings(fund_id: int, db: Session = Depends(get_db)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    months = (
        db.query(HoldingSnapshot.snapshot_month)
        .filter(HoldingSnapshot.fund_id == fund_id)
        .distinct()
        .order_by(HoldingSnapshot.snapshot_month.desc())
        .all()
    )
    month_list = [m[0] for m in months]
    if len(month_list) < 2:
        raise HTTPException(status_code=404, detail="Need at least two months of data")

    current_month = month_list[0]
    prev_month = month_list[1]

    current_rows = db.query(HoldingSnapshot).filter(
        HoldingSnapshot.fund_id == fund_id,
        HoldingSnapshot.snapshot_month == current_month,
    ).all()
    prev_rows = db.query(HoldingSnapshot).filter(
        HoldingSnapshot.fund_id == fund_id,
        HoldingSnapshot.snapshot_month == prev_month,
    ).all()

    current_map = {r.stock_name: r for r in current_rows}
    prev_map = {r.stock_name: r for r in prev_rows}

    all_stocks = set(current_map) | set(prev_map)
    changes: list[HoldingChange] = []
    new_buys = full_exits = increased = decreased = 0

    for stock in sorted(all_stocks):
        curr = current_map.get(stock)
        prev = prev_map.get(stock)

        if curr and not prev:
            status = "NEW_BUY"
            new_buys += 1
        elif prev and not curr:
            status = "FULL_EXIT"
            full_exits += 1
        else:
            diff = round((curr.weightage - prev.weightage), 2)
            if diff > 0.05:
                status = "INCREASED"
                increased += 1
            elif diff < -0.05:
                status = "DECREASED"
                decreased += 1
            else:
                status = "UNCHANGED"

        changes.append(HoldingChange(
            stock_name=stock,
            sector=curr.sector if curr else (prev.sector if prev else None),
            current_weight=curr.weightage if curr else None,
            previous_weight=prev.weightage if prev else None,
            change=round((curr.weightage if curr else 0) - (prev.weightage if prev else 0), 2),
            status=status,
        ))

    # Sort: new buys first, exits last, then by status then weight
    order = {"NEW_BUY": 0, "INCREASED": 1, "DECREASED": 2, "UNCHANGED": 3, "FULL_EXIT": 4}
    changes.sort(key=lambda x: (order.get(x.status, 5), -(x.current_weight or 0)))

    return HoldingsComparisonOut(
        fund_id=fund_id,
        fund_name=fund.scheme_name,
        current_month=current_month,
        previous_month=prev_month,
        changes=changes,
        new_buys=new_buys,
        full_exits=full_exits,
        increased=increased,
        decreased=decreased,
    )


@router.get("/{fund_id}/snapshots")
def list_snapshots(fund_id: int, db: Session = Depends(get_db)):
    months = (
        db.query(HoldingSnapshot.snapshot_month)
        .filter(HoldingSnapshot.fund_id == fund_id)
        .distinct()
        .order_by(HoldingSnapshot.snapshot_month.desc())
        .all()
    )
    return [m[0] for m in months]
