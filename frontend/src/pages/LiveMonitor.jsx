import Navbar from "../components/Navbar"
import { useEffect, useState, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import "./LiveMonitor.css"

const PINOUT = [
  { pin: 34, sensor: "MQ-135", desc: "NH₃ / CO₂ / VOCs", type: "Analog" },
  { pin: 35, sensor: "MQ-4", desc: "Methane Gas", type: "Analog" },
  { pin: 4, sensor: "MQ-3", desc: "Ethanol (Digital Trigger)", type: "Digital" },
  { pin: 5, sensor: "DHT11", desc: "Temperature & Humidity", type: "Digital" },
  { pin: 2, sensor: "Buzzer", desc: "Spoilage Alert", type: "Output" },
  { pin: 21, sensor: "LCD SDA", desc: "Display Data", type: "I2C" },
  { pin: 22, sensor: "LCD SCL", desc: "Display Clock", type: "I2C" },
]

function LiveMonitor() {
  const [liveData, setLiveData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [trendData, setTrendData] = useState([])
  const [showPinout, setShowPinout] = useState(false)
  const [pulseKey, setPulseKey] = useState(0)
  const prevTimestamp = useRef(null)

  useEffect(() => {
    // Firestore real-time listener for the last 20 readings
    const q = query(collection(db, "live_readings"), orderBy("timestamp", "desc"), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readings = [];
      snapshot.forEach((doc) => {
        readings.push(doc.data());
      });
      
      if (readings.length > 0) {
        const latest = readings[0]; // Most recent reading
        setLiveData(latest);
        setConnected(true);
        
        if (latest.timestamp !== prevTimestamp.current) {
          setPulseKey(k => k + 1);
          prevTimestamp.current = latest.timestamp;
        }

        // Reverse to show oldest to newest on the chart
        setTrendData(readings.reverse().map((r, i) => ({
          index: i + 1,
          MQ135: r.mq135,
          MQ4: r.mq4,
          MQ3: r.mq3,
          Temp: r.temperature,
          Humidity: r.humidity,
        })));
      }
    }, (error) => {
      console.warn("Firebase listener error (is your config set?):", error);
      setConnected(false);
    });

    return () => unsubscribe();
  }, [])

  const getEdibilityDisplay = (freshness) => {
    if (freshness === "Fresh") return { icon: "✅", label: "EDIBLE", desc: "Safe to eat or store", cls: "verdict-fresh" }
    if (freshness === "Medium") return { icon: "⚠️", label: "USE SOON", desc: "Consume within 1-2 days", cls: "verdict-medium" }
    return { icon: "❌", label: "NOT EDIBLE", desc: "Do not consume", cls: "verdict-spoiled" }
  }

  const verdict = liveData ? getEdibilityDisplay(liveData.freshness) : null

  return (
    <div className="live-monitor">
      <Navbar />
      <div className="live-body">
        <div className="live-header">
          <div>
            <h2 className="live-title">Live Monitor</h2>
            <p className="live-sub">Real-time sensor feed from ESP32 hardware</p>
          </div>
          <div className="live-header-right">
            <button
              className="pinout-toggle-btn"
              onClick={() => setShowPinout(!showPinout)}
            >
              {showPinout ? "Hide" : "📌"} Pinout
            </button>
            <div className={connected ? "live-status connected" : "live-status disconnected"}>
              <span className={connected ? "status-dot online" : "status-dot offline"}></span>
              {connected ? "Device Connected" : "Waiting for device..."}
            </div>
          </div>
        </div>

        {/* Collapsible Hardware Pinout Panel */}
        {showPinout && (
          <div className="pinout-panel">
            <h3>ESP32 Hardware Pinout</h3>
            <div className="pinout-grid">
              {PINOUT.map(p => (
                <div key={p.pin} className="pinout-item">
                  <span className="pinout-pin">GPIO {p.pin}</span>
                  <span className="pinout-sensor">{p.sensor}</span>
                  <span className="pinout-desc">{p.desc}</span>
                  <span className={`pinout-type type-${p.type.toLowerCase()}`}>{p.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {liveData ? (
          <>
            {/* Edibility Verdict Card */}
            <div className={`verdict-card ${verdict.cls}`} key={pulseKey}>
              <div className="verdict-icon">{verdict.icon}</div>
              <div className="verdict-text">
                <h2 className="verdict-label">{verdict.label}</h2>
                <p className="verdict-desc">{verdict.desc}</p>
              </div>
              <div className="verdict-meta">
                <span className="verdict-fruit">{liveData.fruit}</span>
                <span className="verdict-shelf">{liveData.shelf_life_days} days shelf life</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="live-kpi-row">
              <div className="live-kpi-card">
                <p className="live-kpi-label">FRUIT</p>
                <h2>{liveData.fruit === "Orange" ? "🍊" : "🍋"} {liveData.fruit}</h2>
              </div>
              <div className="live-kpi-card">
                <p className="live-kpi-label">FRESHNESS</p>
                <h2 style={{ color: liveData.freshness === "Fresh" ? "#588157" : liveData.freshness === "Medium" ? "#f59e0b" : "#dc2626" }}>
                  {liveData.freshness}
                </h2>
              </div>
              <div className="live-kpi-card">
                <p className="live-kpi-label">SHELF LIFE</p>
                <h2>{liveData.shelf_life_days} days</h2>
              </div>
              <div className="live-kpi-card">
                <p className="live-kpi-label">ADVICE</p>
                <p className="live-advice-text">{liveData.advice}</p>
              </div>
            </div>

            {/* Sensor Value Cards */}
            <div className="live-sensor-row">
              <div className="live-sensor-card">
                <p className="live-sensor-label">MQ-135 · NH₃</p>
                <h3>{liveData.mq135} <span className="sensor-unit">ppm</span></h3>
              </div>
              <div className="live-sensor-card">
                <p className="live-sensor-label">MQ-4 · Methane</p>
                <h3>{liveData.mq4} <span className="sensor-unit">ppm</span></h3>
              </div>
              <div className="live-sensor-card">
                <p className="live-sensor-label">MQ-3 · Ethanol</p>
                <h3>{liveData.mq3} <span className="sensor-unit">ppm</span></h3>
              </div>
              <div className="live-sensor-card">
                <p className="live-sensor-label">🌡️ Temperature</p>
                <h3>{typeof liveData.temperature === 'number' ? liveData.temperature.toFixed(1) : liveData.temperature}<span className="sensor-unit">°C</span></h3>
              </div>
              <div className="live-sensor-card">
                <p className="live-sensor-label">💧 Humidity</p>
                <h3>{typeof liveData.humidity === 'number' ? liveData.humidity.toFixed(1) : liveData.humidity}<span className="sensor-unit">%</span></h3>
              </div>
            </div>

            {/* Sensor Trend Chart */}
            {trendData.length > 1 && (
              <div className="live-chart-card">
                <h3>Sensor Trend (Last {trendData.length} Readings)</h3>
                <p className="live-chart-sub">Real-time gas sensor values over time</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="MQ135" stroke="#588157" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="MQ4" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="MQ3" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="live-timestamp">Last updated: {liveData.timestamp}</p>
          </>
        ) : (
          <div className="live-empty-state">
            <div className="empty-icon">📡</div>
            <h3>No Live Data Yet</h3>
            <p>Connect your ESP32 to start streaming sensor readings.</p>
            <div className="empty-steps">
              <div className="empty-step">
                <span className="step-num">1</span>
                <p>Upload firmware to ESP32</p>
              </div>
              <div className="empty-step">
                <span className="step-num">2</span>
                <p>Connect to same WiFi network</p>
              </div>
              <div className="empty-step">
                <span className="step-num">3</span>
                <p>Start the Flask backend server</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveMonitor