"""
Simulated water-flow sensor + statistical anomaly detection. Real deployments
plug an ESP32/flow-sensor into the same `record_reading()` path over the
architecture described in the README - this module exists so the whole
pipeline (ingest -> anomaly detection -> alert -> dashboard) can be
demonstrated and unit-tested without physical hardware.

Anomaly detection: two real, simple statistical techniques -
  1. z-score vs the device's own historical mean/std (flags unusually high
     flow for that device)
  2. a night-flow heuristic (continuous flow during typically-unoccupied
     hours is a classic leak signature)
"""
import random
from typing import List, Optional

import numpy as np

from app.config import settings

# Baseline litres/minute by hour-of-day (rough household-shaped usage curve)
HOURLY_BASELINE = [
    0.2, 0.2, 0.1, 0.1, 0.2, 0.8,   # 00-05
    2.5, 4.0, 3.0, 1.5, 1.0, 1.2,   # 06-11
    1.8, 1.2, 0.8, 0.7, 1.0, 2.2,   # 12-17
    3.5, 2.8, 1.5, 0.8, 0.4, 0.3,   # 18-23
]


def simulate_readings(hour_start: int, count: int, inject_leak: bool) -> List[dict]:
    """Generates `count` sequential hourly readings starting at hour_start (0-23, wraps)."""
    readings = []
    leak_hour = random.choice(range(0, 5)) if inject_leak else None

    for i in range(count):
        hour = (hour_start + i) % 24
        base = HOURLY_BASELINE[hour]
        noise = max(0.0, random.gauss(base, base * 0.25 + 0.05))
        flow = round(noise, 2)

        if inject_leak and hour == leak_hour:
            flow = round(base + random.uniform(4.0, 8.0), 2)  # sustained abnormal night flow

        readings.append({"flow_rate_lpm": flow, "reading_hour": hour})

    return readings


def detect_anomaly(flow: float, hour: int, history: List[float]) -> tuple[bool, Optional[str]]:
    if hour <= 5 and flow >= settings.night_flow_threshold_lpm:
        return True, f"Sustained flow of {flow} L/min detected at {hour:02d}:00 - possible leak"

    if len(history) >= 5:
        mean = float(np.mean(history))
        std = float(np.std(history)) or 0.01
        z = (flow - mean) / std
        if z >= settings.anomaly_z_threshold:
            return True, f"Flow {flow} L/min is {round(z, 1)} standard deviations above this device's normal usage"

    return False, None
