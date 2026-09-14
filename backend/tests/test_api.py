from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app, headers={"X-API-Key": settings.api_key})


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200


def test_protected_endpoint_rejects_missing_key():
    anon = TestClient(app)
    r = anon.get("/api/dashboard/summary")
    assert r.status_code == 401


def test_dashboard_summary_shape():
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    for key in ["total_devices", "today_usage_liters", "week_usage_liters", "month_usage_liters", "active_alerts"]:
        assert key in r.json()


def test_create_device_and_simulate_readings():
    r = client.post("/api/devices", json={"name": "Kitchen meter", "property_type": "residential"})
    assert r.status_code == 200
    device_id = r.json()["id"]

    r2 = client.post(f"/api/simulate/{device_id}", params={"hours": 12, "inject_leak": True})
    assert r2.status_code == 200
    readings = r2.json()
    assert len(readings) == 12

    r3 = client.get("/api/alerts")
    assert r3.status_code == 200


def test_simulate_unknown_device_returns_404():
    r = client.post("/api/simulate/999999", params={"hours": 5})
    assert r.status_code == 404
