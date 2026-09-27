import Navbar from "../components/Navbar"
import { useEffect, useState } from "react"
import { getLiveData, getDeviceStatus } from "../services/api"
import "./Devices.css"

const sensorList = [
  { id: "MQ-135", pin: "GPIO 34", label: "Ammonia & CO₂ Sensor", desc: "Detects ammonia, carbon dioxide, and other harmful gases released during fruit decay.", icon: "🧪", type: "Analog" },
  { id: "MQ-4", pin: "GPIO 35", label: "Methane Sensor", desc: "Detects methane gas produced during bacterial decomposition of organic matter.", icon: "🔥", type: "Analog" },
  { id: "MQ-3", pin: "GPIO 4", label: "Ethanol Sensor", desc: "Detects ethanol vapors released during fermentation — digital trigger mode.", icon: "🍷", type: "Digital" },
  { id: "DHT11", pin: "GPIO 5", label: "Temp & Humidity Sensor", desc: "Monitors environmental temperature and humidity which directly affect shelf life.", icon: "🌡️", type: "Digital" },
  { id: "Buzzer", pin: "GPIO 2", label: "Alert Buzzer", desc: "Sounds an alarm when the ML model detects spoiled fruit.", icon: "🔔", type: "Output" },
  { id: "LCD SDA", pin: "GPIO 21", label: "I2C LCD Display (Data)", desc: "Shows real-time sensor readings and freshness results on a 16×2 LCD.", icon: "📟", type: "I2C" },
  { id: "LCD SCL", pin: "GPIO 22", label: "I2C LCD Display (Clock)", desc: "Clock line for the I2C LCD communication bus.", icon: "📟", type: "I2C" },
]

function Devices() {
  const [connected, setConnected] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState(null)

  useEffect(() => {
    const fetchStatus = () => {
      getLiveData().then(res => setConnected(res.connected)).catch(() => setConnected(false))
      getDeviceStatus().then(setDeviceInfo).catch(() => {})
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="devices">
      <Navbar />
      <div className="devices-body">
        <h2 className="devices-title">Devices</h2>
        <p className="devices-sub">Hardware sensors connected to your Smart E-Nose ESP32 system</p>

        <div className="devices-status-banner" style={{ background: connected ? "#d1e8d1" : "#f0ece4" }}>
          <span style={{ color: connected ? "#1a4d2e" : "#99948a", fontWeight: 600 }}>
            {connected ? "● ESP32 Connected — All sensors online" : "● ESP32 Disconnected — Waiting for device..."}
          </span>
          {deviceInfo && (
            <div className="device-meta">
              <span>Total readings: <strong>{deviceInfo.total_readings}</strong></span>
              {deviceInfo.last_seen && <span>Last seen: <strong>{deviceInfo.last_seen}</strong></span>}
            </div>
          )}
        </div>

        {/* Hardware Pinout Summary */}
        <div className="pinout-summary">
          <h3>📌 ESP32 Hardware Pinout</h3>
          <div className="pinout-table-wrap">
            <table className="pinout-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>GPIO Pin</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {sensorList.map(s => (
                  <tr key={s.id}>
                    <td><span className="pinout-icon">{s.icon}</span> {s.id}</td>
                    <td><code>{s.pin}</code></td>
                    <td><span className={`pin-type-badge type-${s.type.toLowerCase()}`}>{s.type}</span></td>
                    <td>{s.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="devices-grid">
          {sensorList.map(sensor => (
            <div key={sensor.id} className="device-card">
              <div className="device-card-top">
                <span className="device-icon">{sensor.icon}</span>
                <span className={connected ? "device-badge online" : "device-badge offline"}>
                  {connected ? "Online" : "Offline"}
                </span>
              </div>
              <h3 className="device-id">{sensor.id}</h3>
              <p className="device-pin">{sensor.pin} · {sensor.type}</p>
              <p className="device-label">{sensor.label}</p>
              <p className="device-desc">{sensor.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Devices