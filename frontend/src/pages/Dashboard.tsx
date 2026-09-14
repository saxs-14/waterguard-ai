import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api, DashboardSummary, Device, Reading, Alert } from "../lib/api";
import KpiCard from "../components/KpiCard";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, d, r, a] = await Promise.all([api.summary(), api.devices(), api.readings(), api.alerts()]);
      setSummary(s);
      setDevices(d);
      setReadings(r);
      setAlerts(a);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    api.health().then(() => setApiOnline(true)).catch(() => setApiOnline(false));
    refresh();
  }, [refresh]);

  const addDevice = async () => {
    if (!deviceName) return;
    setLoading(true);
    setError(null);
    try {
      await api.createDevice(deviceName, "residential");
      setDeviceName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add device");
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (deviceId: number, injectLeak: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await api.simulate(deviceId, 24, injectLeak);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const chartData = readings
    .slice(0, 30)
    .reverse()
    .map((r) => ({ h: `${r.reading_hour}:00`, flow: r.flow_rate_lpm, anomaly: r.is_anomaly }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          WaterGuard AI
        </Link>
        <span className="flex items-center gap-2 text-xs">
          <span className={`inline-block h-2 w-2 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          {apiOnline === null ? "Checking..." : apiOnline ? "Backend online" : "Backend offline"}
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {!apiOnline && apiOnline !== null && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
            Can't reach the backend at <code>/api</code>. Start it with <code>uvicorn app.main:app --reload</code>.
          </div>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-semibold mb-4">Devices</h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              placeholder="Device name (e.g. Kitchen meter)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <button
              disabled={!deviceName || loading}
              onClick={addDevice}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition px-4 py-2 text-sm font-medium"
            >
              Add device
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          {devices.length === 0 ? (
            <p className="text-sm text-slate-500">No devices yet — add one above.</p>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
                  <span className="text-sm">{d.name} <span className="text-slate-500 capitalize">({d.property_type})</span></span>
                  <div className="flex gap-2">
                    <button
                      disabled={loading}
                      onClick={() => runSimulation(d.id, false)}
                      className="text-xs rounded-lg border border-slate-700 hover:border-slate-500 px-3 py-1.5"
                    >
                      Simulate normal day
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => runSimulation(d.id, true)}
                      className="text-xs rounded-lg border border-amber-600 text-amber-400 hover:border-amber-500 px-3 py-1.5"
                    >
                      Simulate with leak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Devices" value={summary?.total_devices ?? "-"} />
          <KpiCard label="Today (L)" value={summary?.today_usage_liters ?? "-"} />
          <KpiCard label="This week (L)" value={summary?.week_usage_liters ?? "-"} />
          <KpiCard label="This month (L)" value={summary?.month_usage_liters ?? "-"} />
          <KpiCard label="Active alerts (24h)" value={summary?.active_alerts ?? "-"} accent="alert" />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-semibold mb-4">Flow rate (recent readings)</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500">No readings yet — simulate a day above.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="h" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Line type="monotone" dataKey="flow" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Alerts</h2>
            <a href={api.exportCsvUrl()} className="text-sm rounded-lg border border-slate-700 hover:border-slate-500 transition px-3 py-1.5">
              Export readings CSV
            </a>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500">No alerts.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.map((a) => (
                <li key={a.id} className="rounded-lg border border-amber-600/30 bg-amber-500/5 p-3 text-amber-300">
                  {a.message} <span className="text-slate-500">— {new Date(a.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
