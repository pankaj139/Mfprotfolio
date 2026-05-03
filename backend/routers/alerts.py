from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Alert, Fund
from schemas import AlertOut

router = APIRouter()


@router.get("/", response_model=list[AlertOut])
def list_alerts(
    unread_only: bool = Query(False),
    severity: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Alert).join(Fund)
    if unread_only:
        q = q.filter(Alert.is_read == False)
    if severity:
        q = q.filter(Alert.severity == severity.upper())
    alerts = q.order_by(Alert.created_at.desc()).all()

    result = []
    for a in alerts:
        out = AlertOut.model_validate(a)
        out.fund_name = a.fund.scheme_name if a.fund else None
        result.append(out)
    return result


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db)):
    count = db.query(Alert).filter(Alert.is_read == False).count()
    breakdown = {}
    for row in (
        db.query(Alert.alert_type, Alert.severity)
        .filter(Alert.is_read == False)
        .all()
    ):
        breakdown[row[0]] = breakdown.get(row[0], 0) + 1
    return {"count": count, "breakdown": breakdown}


@router.put("/{alert_id}/read", response_model=AlertOut)
def mark_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    out = AlertOut.model_validate(alert)
    out.fund_name = alert.fund.scheme_name if alert.fund else None
    return out


@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All alerts marked as read"}


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
