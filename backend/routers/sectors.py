from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Fund, SectorSnapshot
from schemas import SectorComparisonOut, SectorChange

router = APIRouter()


@router.get("/{fund_id}/compare", response_model=SectorComparisonOut)
def compare_sectors(
    fund_id: int,
    threshold: float = Query(2.0, description="Highlight threshold in %"),
    db: Session = Depends(get_db),
):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    months = (
        db.query(SectorSnapshot.snapshot_month)
        .filter(SectorSnapshot.fund_id == fund_id)
        .distinct()
        .order_by(SectorSnapshot.snapshot_month.desc())
        .all()
    )
    month_list = [m[0] for m in months]
    if len(month_list) < 2:
        raise HTTPException(status_code=404, detail="Need at least two months of data")

    current_month = month_list[0]
    prev_month = month_list[1]

    current_rows = db.query(SectorSnapshot).filter(
        SectorSnapshot.fund_id == fund_id,
        SectorSnapshot.snapshot_month == current_month,
    ).all()
    prev_rows = db.query(SectorSnapshot).filter(
        SectorSnapshot.fund_id == fund_id,
        SectorSnapshot.snapshot_month == prev_month,
    ).all()

    current_map = {r.sector_name: r.weightage for r in current_rows}
    prev_map = {r.sector_name: r.weightage for r in prev_rows}

    all_sectors = set(current_map) | set(prev_map)
    changes: list[SectorChange] = []

    for sector in sorted(all_sectors):
        curr_w = current_map.get(sector)
        prev_w = prev_map.get(sector)

        if curr_w is not None and prev_w is None:
            status = "NEW"
            diff = curr_w
        elif prev_w is not None and curr_w is None:
            status = "EXITED"
            diff = -prev_w
        else:
            diff = round((curr_w or 0) - (prev_w or 0), 2)
            if abs(diff) >= threshold:
                status = "INCREASED" if diff > 0 else "DECREASED"
            else:
                status = "UNCHANGED"

        changes.append(SectorChange(
            sector_name=sector,
            current_weight=curr_w,
            previous_weight=prev_w,
            change=round(diff, 2),
            status=status,
        ))

    changes.sort(key=lambda x: -(abs(x.change or 0)))

    return SectorComparisonOut(
        fund_id=fund_id,
        fund_name=fund.scheme_name,
        current_month=current_month,
        previous_month=prev_month,
        changes=changes,
        threshold=threshold,
    )
