import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://waterguard-ai-saxs-14s-projects.vercel.app";
const TITLE = "WaterGuard AI — Smart Water Leak Detection";
const DESCRIPTION =
  "Simulated sensor mode today, real ESP32/flow-sensor hardware tomorrow. Same API, same dashboard, same leak-detection pipeline.";

const JSON_LD = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "WaterGuard AI", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "description": "Simulated sensor mode today, real ESP32/flow-sensor hardware tomorrow. Same API, same dashboard, same leak-detection pipeline.", "url": "https://waterguard-ai-saxs-14s-projects.vercel.app", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}};

const FEATURES = [
  { title: "Live usage dashboard", desc: "Daily, weekly and monthly water usage at a glance." },
  { title: "Leak/anomaly detection", desc: "Statistical detection of abnormal or sustained night-time flow." },
  { title: "Simulated IoT mode", desc: "Demonstrate the full pipeline without physical sensors." },
  { title: "Hardware-ready architecture", desc: "Same API accepts real ESP32/flow-sensor readings later." },
  { title: "Historical graphs & export", desc: "Track usage over time, export for reporting." },
  { title: "Threshold configuration", desc: "Tune anomaly sensitivity per deployment." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={SITE_URL + "/"} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL + "/"} />
        <meta property="og:image" content={SITE_URL + "/og-image.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={SITE_URL + "/og-image.png"} />

        <script type="application/ld+json">{JSON.stringify(JSON_LD)}</script>
      </Helmet>

      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          WaterGuard AI
        </div>
        <Link to="/app" className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-sm font-medium">
          Open dashboard
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Catch water waste <span className="text-blue-400">before the bill does</span>
          </h1>
          <p className="mt-5 text-slate-400 max-w-2xl mx-auto text-lg">
            Simulated sensor mode today, real ESP32/flow-sensor hardware tomorrow — same
            API, same dashboard, same leak-detection pipeline.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/app" className="rounded-lg bg-blue-600 hover:bg-blue-500 transition px-5 py-3 font-medium">
              Try the live demo
            </Link>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          <h2 className="sr-only">Features</h2>
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="py-16 grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">Who it's for</h2>
            <ul className="text-slate-400 space-y-1.5 text-sm">
              <li>Homes</li>
              <li>Restaurants</li>
              <li>Schools</li>
              <li>Farms</li>
              <li>Hotels & factories</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">Pricing model</h2>
            <ul className="text-slate-400 space-y-1.5 text-sm">
              <li>Hardware + software bundle</li>
              <li>Monthly monitoring subscription</li>
              <li>Per-property subscription</li>
              <li>Enterprise monitoring</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        WaterGuard AI — water monitoring MVP. Simulated data by default, hardware-ready.
      </footer>
    </div>
  );
}
