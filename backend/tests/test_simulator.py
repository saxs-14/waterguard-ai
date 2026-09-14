from app.simulator import simulate_readings, detect_anomaly


def test_simulate_readings_returns_requested_count():
    readings = simulate_readings(hour_start=0, count=24, inject_leak=False)
    assert len(readings) == 24
    for r in readings:
        assert r["flow_rate_lpm"] >= 0
        assert 0 <= r["reading_hour"] <= 23


def test_simulate_readings_with_leak_has_a_high_night_value():
    readings = simulate_readings(hour_start=0, count=6, inject_leak=True)
    night_readings = [r for r in readings if r["reading_hour"] <= 5]
    assert any(r["flow_rate_lpm"] >= 4.0 for r in night_readings)


def test_detect_anomaly_flags_night_flow():
    is_anomaly, reason = detect_anomaly(flow=5.0, hour=2, history=[])
    assert is_anomaly is True
    assert reason is not None


def test_detect_anomaly_flags_statistical_outlier():
    history = [1.0, 1.1, 0.9, 1.0, 1.2, 0.95]
    is_anomaly, reason = detect_anomaly(flow=10.0, hour=14, history=history)
    assert is_anomaly is True


def test_detect_anomaly_normal_reading_not_flagged():
    history = [1.0, 1.1, 0.9, 1.0, 1.2, 0.95]
    is_anomaly, reason = detect_anomaly(flow=1.05, hour=14, history=history)
    assert is_anomaly is False
