from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Fund, Alert
from schemas import FundOut

router = APIRouter()


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    funds = db.query(Fund).all()
    total_alerts = db.query(Alert).filter(Alert.is_read == False).count()

    severity_counts: dict[str, int] = {}
    type_counts: dict[str, int] = {}
    for a in db.query(Alert).filter(Alert.is_read == False).all():
        severity_counts[a.severity] = severity_counts.get(a.severity, 0) + 1
        type_counts[a.alert_type] = type_counts.get(a.alert_type, 0) + 1

    return {
        "total_funds": len(funds),
        "unread_alerts": total_alerts,
        "severity_counts": severity_counts,
        "type_counts": type_counts,
        "funds": [FundOut.model_validate(f) for f in funds],
    }
