import csv
import io
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import Device, Reading, Alert
from app.schemas import ReadingOut, AlertOut, DashboardSummary
from app.simulator import simulate_readings, detect_anomaly

router = APIRouter(prefix="/api", tags=["readings"])


@router.post("/simulate/{device_id}", response_model=List[ReadingOut])
def simulate(device_id: int, hours: int = 24, inject_leak: bool = False, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    history_rows = (
        db.query(Reading.flow_rate_lpm)
        .filter(Reading.device_id == device_id)
        .order_by(Reading.timestamp.desc())
        .limit(48)
        .all()
    )
    history = [r[0] for r in history_rows]

    simulated = simulate_readings(hour_start=0, count=hours, inject_leak=inject_leak)
    created = []
    for s in simulated:
        is_anomaly, reason = detect_anomaly(s["flow_rate_lpm"], s["reading_hour"], history)
        reading = Reading(
            device_id=device_id, flow_rate_lpm=s["flow_rate_lpm"], reading_hour=s["reading_hour"],
            is_anomaly=is_anomaly, anomaly_reason=reason,
        )
        db.add(reading)
        history.append(s["flow_rate_lpm"])
        if is_anomaly:
            db.add(Alert(device_id=device_id, message=reason))
        created.append(reading)

    db.commit()
    for r in created:
        db.refresh(r)
    return created


@router.get("/readings", response_model=List[ReadingOut])
def list_readings(device_id: Optional[int] = None, limit: int = Query(300, le=2000), db: Session = Depends(get_db)):
    q = db.query(Reading)
    if device_id:
        q = q.filter(Reading.device_id == device_id)
    return q.order_by(Reading.timestamp.desc()).limit(limit).all()


@router.get("/readings/export")
def export_readings(db: Session = Depends(get_db)):
    readings = db.query(Reading).order_by(Reading.timestamp.desc()).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "device_id", "flow_rate_lpm", "hour", "is_anomaly", "reason", "timestamp"])
    for r in readings:
        writer.writerow([r.id, r.device_id, r.flow_rate_lpm, r.reading_hour, r.is_anomaly, r.anomaly_reason, r.timestamp])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=waterguard_readings.csv"},
    )


@router.get("/alerts", response_model=List[AlertOut])
def list_alerts(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()


@router.get("/dashboard/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)):
    total_devices = db.query(func.count(Device.id)).scalar() or 0
    now = datetime.now(timezone.utc)

    today_total = db.query(func.sum(Reading.flow_rate_lpm)).filter(
        Reading.timestamp >= now - timedelta(days=1)
    ).scalar() or 0.0
    week_total = db.query(func.sum(Reading.flow_rate_lpm)).filter(
        Reading.timestamp >= now - timedelta(days=7)
    ).scalar() or 0.0
    month_total = db.query(func.sum(Reading.flow_rate_lpm)).filter(
        Reading.timestamp >= now - timedelta(days=30)
    ).scalar() or 0.0
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.timestamp >= now - timedelta(days=1)).scalar() or 0

    return DashboardSummary(
        total_devices=total_devices,
        today_usage_liters=round(today_total, 1),
        week_usage_liters=round(week_total, 1),
        month_usage_liters=round(month_total, 1),
        active_alerts=active_alerts,
    )
