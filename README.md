# WaterGuard AI

Smart water monitoring and leak-detection MVP, IoT-hardware-ready but demoable with zero
physical sensors.

## Problem statement

Water loss from leaks and abnormal consumption wastes money and scarce resources, often
going unnoticed until the bill arrives.

## Solution

Register a property/device, generate (or later, ingest real) flow readings, and
WaterGuard AI flags leaks and abnormal usage statistically — on a live dashboard with
daily/weekly/monthly totals.

## Features

- Water usage dashboard (daily/weekly/monthly)
- Simulated sensor mode (no hardware required to demo)
- Real-sensor-ready API — same ingestion path an ESP32/flow-sensor would use
- Statistical anomaly detection (z-score vs. device history + a night-flow leak heuristic)
- Alerts, historical graphs, CSV export
- Property/device management

## Architecture

```text
frontend (React/Vite/TS/Tailwind)  ->  backend (FastAPI)  ->  SQLite
                                              |
                                     simulated sensor OR real ESP32/flow-sensor
                                     -> same /api/simulate-style ingestion path
                                     -> z-score + night-flow anomaly detection
```

To connect real hardware later: an ESP32 with a flow sensor posts readings to the same
data model this API already uses (`flow_rate_lpm`, `reading_hour`) - no architecture
change needed, just a new ingestion endpoint that calls the same `detect_anomaly()`
function used by the simulator.

## Technology stack

Python, FastAPI, SQLAlchemy, SQLite, NumPy (for the statistics); React, TypeScript, Vite,
Tailwind CSS, Recharts.

## Folder structure

```text
waterguard-ai/
├── backend/
│   ├── app/          # FastAPI app, simulator + anomaly detection
│   └── tests/
├── frontend/
│   └── src/             # Landing page + dashboard
├── docker-compose.yml
└── README.md
```

## Installation

```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

```bash
cd frontend && npm install
```

## Environment variables

`ANOMALY_Z_THRESHOLD` (statistical outlier sensitivity), `NIGHT_FLOW_THRESHOLD_LPM` (leak
heuristic), `CORS_ORIGINS` — see `backend/.env.example`.

## Running locally

```bash
# Terminal 1
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173. Docker: `docker compose up --build`.

## Demo instructions

1. Add a device (e.g. "Kitchen meter").
2. Click **Simulate normal day** to generate a realistic 24-hour usage curve.
3. Click **Simulate with leak** on another run to inject a sustained abnormal night-time
   flow — watch it appear as a flagged alert and a spike on the chart.

## API documentation

Docs at `/docs`. Key endpoints: `POST /api/devices`, `GET /api/devices`,
`POST /api/simulate/{device_id}`, `GET /api/readings`, `GET /api/readings/export`,
`GET /api/alerts`, `GET /api/dashboard/summary`.

## Database

SQLite: `devices`, `readings`, `alerts`.

## Security considerations

- **API key required on every endpoint except `/api/health`.** Set `API_KEY` (backend
  `.env`) and `VITE_API_KEY` (frontend `.env`) to the same value before deploying anywhere
  reachable outside your own machine — the default (`dev-local-key-change-me`) is for
  local development only. Single-tenant "licensed instance" model, not per-user accounts.
- Rate limiting (30 req/60s/IP) on the readings/simulate endpoints.
- CORS restricted, no secrets in source.

## Privacy considerations

Water usage data is property-level, not individual-level, in this schema. No personal
data is collected by default.

## Limitations

- **Simulated data by default.** The `/api/simulate` endpoint generates a plausible usage
  curve with an optional injected leak — it is not a real building's water usage. Real
  hardware integration (ESP32 + flow sensor over MQTT/HTTP) is architecturally supported
  but not implemented in this MVP.
- Anomaly detection is z-score + a fixed night-flow threshold — both real, standard
  techniques, but a production deployment should calibrate thresholds per property type
  (a restaurant's "normal" night flow differs from a home's).

## Business model

**Target customers**: homes, restaurants, schools, farms, hotels, factories,
municipalities.

**Revenue**: hardware + software bundle, monthly monitoring subscription, per-property
subscription, enterprise monitoring.

## Future improvements

- Real ESP32/flow-sensor MQTT ingestion endpoint
- Per-property-type baseline calibration
- SMS/email leak alerts
- Multi-property portfolio dashboard for property managers

## Screenshots

Run locally (see "Running locally"), add a device, and click **Simulate with leak** on
`/app`.
