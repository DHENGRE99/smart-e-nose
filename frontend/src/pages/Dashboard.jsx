import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { predictFreshness } from "../services/api"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import "./Dashboard.css"

const weekData = [
  { day: "Mon", score: 90 },
  { day: "Tue", score: 85 },
  { day: "Wed", score: 78 },
  { day: "Thu", score: 70 },
  { day: "Fri", score: 55 },
  { day: "Sat", score: 40 },
  { day: "Today", score: 0 },
]

function Dashboard() {
  const navigate = useNavigate()
  const [fruit, setFruit] = useState("Orange")
  const [sensors, setSensors] = useState({ mq135: "", mq4: "", mq3: "", temperature: "", humidity: "" })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeMenu, setActiveMenu] = useState("Dashboard")
  const [hardwareMode, setHardwareMode] = useState(false)
  const [hwConnected, setHwConnected] = useState(false)

  // Poll live data when hardware mode is ON
  useEffect(() => {
    if (!hardwareMode) return;

    const q = query(collection(db, "live_readings"), orderBy("timestamp", "desc"), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readings = [];
      snapshot.forEach((doc) => readings.push(doc.data()));
      
      if (readings.length > 0) {
        const latest = readings[0];
        setHwConnected(true);
        setSensors({
          mq135: String(latest.mq135),
          mq4: String(latest.mq4),
          mq3: String(latest.mq3),
          temperature: String(typeof latest.temperature === 'number' ? latest.temperature.toFixed(1) : latest.temperature),
          humidity: String(typeof latest.humidity === 'number' ? latest.humidity.toFixed(1) : latest.humidity),
        });
        setFruit(latest.fruit || "Orange");
        setResult(latest);
      }
    }, (error) => {
      console.warn("Firebase listener error:", error);
      setHwConnected(false);
    });

    return () => unsubscribe();
  }, [hardwareMode])

  // Check initial device status
  useEffect(() => {
    // Initial check will be handled when switching to hardware mode
  }, [])

  const handlePredict = async () => {
    setLoading(true)
    try {
      const data = await predictFreshness({
        mq135: parseFloat(sensors.mq135),
        mq4: parseFloat(sensors.mq4),
        mq3: parseFloat(sensors.mq3),
        temperature: parseFloat(sensors.temperature),
        humidity: parseFloat(sensors.humidity),
        fruit: fruit
      })
      setResult(data)
      weekData[6].score = data.freshness === "Fresh" ? 90 : data.freshness === "Medium" ? 50 : 15
    } catch (error) {
      alert("Error connecting to backend. Make sure Flask is running!")
    }
    setLoading(false)
  }

  const getBarWidth = (value, max) => Math.min((value / max) * 100, 100)

  const getFreshnessColor = (freshness) => {
    if (freshness === "Fresh") return "#1a4d2e"
    if (freshness === "Medium") return "#f59e0b"
    return "#dc2626"
  }

  const getFreshnessScore = (freshness) => {
    if (freshness === "Fresh") return 90
    if (freshness === "Medium") return 55
    return 15
  }

  const getStatusLabel = (value, sensor) => {
    const thresholds = { mq135: 150, mq4: 90, mq3: 100 }
    if (!value) return "—"
    return value < thresholds[sensor] ? "Normal" : value < thresholds[sensor] * 1.7 ? "Moderate" : "High"
  }

  const getStatusColor = (value, sensor) => {
    const thresholds = { mq135: 150, mq4: 90, mq3: 100 }
    if (!value) return "#999"
    return value < thresholds[sensor] ? "#1a4d2e" : value < thresholds[sensor] * 1.7 ? "#f59e0b" : "#dc2626"
  }

  return (
    <div className="db-layout">
      <div className="db-sidebar">
        <div className="db-logo">🍊 E-Nose</div>
        <div className="db-menu-section">
          <p className="db-menu-label">OVERVIEW</p>
          {["Dashboard", "Insights", "Live Monitor"].map(item => (
            <div key={item}
              className={activeMenu === item ? "db-menu-item active" : "db-menu-item"}
              onClick={() => {
                setActiveMenu(item)
                if (item === "Insights") navigate("/insights")
                if (item === "Live Monitor") navigate("/live-monitor")
              }}>
              {item === "Dashboard" ? "🏠" : item === "Insights" ? "🔬" : "📡"} {item}
            </div>
          ))}
        </div>
        <div className="db-menu-section">
          <p className="db-menu-label">MANAGEMENT</p>
          {["Alerts", "Analytics", "Devices"].map(item => (
            <div key={item}
              className={activeMenu === item ? "db-menu-item active" : "db-menu-item"}
              onClick={() => {
                setActiveMenu(item)
                if (item === "Analytics") navigate("/analytics")
                if (item === "Alerts") navigate("/alerts")
                if (item === "Devices") navigate("/devices")
              }}>
              {item === "Alerts" ? "🔔" : item === "Analytics" ? "📊" : "⚙️"} {item}
            </div>
          ))}
        </div>
        <div className="db-menu-bottom">
          <div className="db-menu-item" onClick={() => navigate("/")}>🏡 Home</div>
          <div className="db-menu-item" onClick={() => navigate("/about")}>ℹ️ About</div>
        </div>
      </div>

      <div className="db-main">
        <div className="db-header">
          <div>
            <h2>Food Quality Overview</h2>
            <p>3 sensors active · Citrus detection</p>
          </div>
          <div className="db-header-right">
            {/* ESP32 Connection Badge */}
            <div className={`db-hw-badge ${hwConnected ? "online" : "offline"}`}>
              <span className={`hw-dot ${hwConnected ? "online" : "offline"}`}></span>
              ESP32 {hwConnected ? "Online" : "Offline"}
            </div>

            {/* Hardware Mode Toggle */}
            <div className="db-hw-toggle" onClick={() => setHardwareMode(!hardwareMode)}>
              <div className={`toggle-track ${hardwareMode ? "active" : ""}`}>
                <div className="toggle-thumb"></div>
              </div>
              <span className="toggle-label">{hardwareMode ? "Hardware" : "Manual"}</span>
            </div>

            <div className="db-fruit-selector">
              <button className={fruit === "Orange" ? "fruit-btn active" : "fruit-btn"} onClick={() => setFruit("Orange")} disabled={hardwareMode}>🍊 Orange</button>
              <button className={fruit === "Lemon" ? "fruit-btn active" : "fruit-btn"} onClick={() => setFruit("Lemon")} disabled={hardwareMode}>🍋 Lemon</button>
            </div>
            <button className="db-analyze-btn" onClick={handlePredict} disabled={loading || hardwareMode}>
              {hardwareMode ? "📡 Auto Mode" : loading ? "Analyzing..." : "+ Analyze Sample"}
            </button>
          </div>
        </div>

        <div className="db-kpi-row">
          <div className="db-kpi-card">
            <p className="db-kpi-label">FRESHNESS SCORE</p>
            <div className="db-score-circle" style={{ borderColor: result ? getFreshnessColor(result.freshness) : "#d1e8d1" }}>
              <span className="db-score-number">{result ? getFreshnessScore(result.freshness) : "—"}</span>
              <span className="db-score-pct">%</span>
            </div>
            <p className="db-kpi-status" style={{ color: result ? getFreshnessColor(result.freshness) : "#999" }}>
              {result ? `● ${result.freshness}` : "● No data"}
            </p>
          </div>

          <div className="db-kpi-card">
            <p className="db-kpi-label">EST. SHELF LIFE</p>
            <h2 className="db-kpi-value">{result ? `${result.shelf_life_days}` : "—"}</h2>
            <p className="db-kpi-unit">days remaining</p>
            <p className="db-kpi-sub">{result ? `${result.fruit} · ${hardwareMode ? "live from ESP32" : "analyzed just now"}` : "Run analysis to see"}</p>
          </div>

          <div className="db-kpi-card">
            <p className="db-kpi-label">ADVICE</p>
            <p className="db-kpi-advice">{result ? result.advice : hardwareMode ? "Waiting for hardware data..." : "Enter sensor values and click Analyze Sample"}</p>
          </div>
        </div>

        <div className="db-sensor-row">
          {[
            { key: "mq3", label: "MQ-3 · Ethanol", unit: "ppm", max: 380, desc: "Ethanol / alcohol vapors" },
            { key: "mq135", label: "MQ-135 · NH₃", unit: "ppm", max: 400, desc: "NH₃ · CO₂ · other VOCs" },
            { key: "mq4", label: "MQ-4 · Methane", unit: "ppm", max: 350, desc: "Methane / decomposition" },
          ].map(s => (
            <div key={s.key} className="db-sensor-card">
              <div className="db-sensor-top">
                <span>{s.label}</span>
                <span className="db-sensor-status" style={{ color: getStatusColor(sensors[s.key], s.key) }}>
                  ● {getStatusLabel(sensors[s.key], s.key)}
                </span>
              </div>
              <div className="db-sensor-input-row">
                <input
                  type="number"
                  placeholder="0"
                  value={sensors[s.key]}
                  onChange={(e) => setSensors({ ...sensors, [s.key]: e.target.value })}
                  className="db-sensor-input"
                  disabled={hardwareMode}
                />
                <span className="db-sensor-unit">{s.unit}</span>
              </div>
              <p className="db-sensor-desc">{s.desc}{hardwareMode ? " · live feed" : ""}</p>
              <div className="db-bar-track">
                <div className="db-bar-fill" style={{
                  width: `${getBarWidth(sensors[s.key], s.max)}%`,
                  backgroundColor: getStatusColor(sensors[s.key], s.key)
                }}></div>
              </div>
              <div className="db-bar-range">
                <span>0</span>
                <span>{s.max} ppm</span>
              </div>
            </div>
          ))}
        </div>

        <div className="db-bottom-row">
          <div className="db-env-card">
            <p className="db-kpi-label">ENVIRONMENT</p>
            <div className="db-env-row">
              <div className="db-env-item">
                <span>🌡️</span>
                <div>
                  <input type="number" placeholder="0" value={sensors.temperature}
                    onChange={(e) => setSensors({ ...sensors, temperature: e.target.value })}
                    className="db-env-input" disabled={hardwareMode} />
                  <p>Temperature °C</p>
                </div>
              </div>
              <div className="db-env-item">
                <span>💧</span>
                <div>
                  <input type="number" placeholder="0" value={sensors.humidity}
                    onChange={(e) => setSensors({ ...sensors, humidity: e.target.value })}
                    className="db-env-input" disabled={hardwareMode} />
                  <p>Humidity %</p>
                </div>
              </div>
            </div>
          </div>

          <div className="db-chart-card">
            <div className="db-chart-header">
              <p className="db-kpi-label">7-DAY FRESHNESS TREND</p>
              <span>This week</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weekData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="score" fill="#1a4d2e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard