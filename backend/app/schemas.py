from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DeviceCreate(BaseModel):
    name: str
    property_type: str = "residential"


class DeviceOut(BaseModel):
    id: int
    name: str
    property_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReadingOut(BaseModel):
    id: int
    device_id: int
    flow_rate_lpm: float
    reading_hour: int
    is_anomaly: bool
    anomaly_reason: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    device_id: int
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_devices: int
    today_usage_liters: float
    week_usage_liters: float
    month_usage_liters: float
    active_alerts: int
