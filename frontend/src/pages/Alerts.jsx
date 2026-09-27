import Navbar from "../components/Navbar"
import { useEffect, useState } from "react"
import { getHistory } from "../services/api"
import "./Alerts.css"

function Alerts() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    getHistory().then(data => {
      const spoiled = data.records.filter(r => r.freshness === "Spoiled")
      setAlerts(spoiled)
    })
  }, [])

  return (
  <div className="alerts">
    <Navbar />
    <div className="alerts-body">
      <h2 className="alerts-title">Alerts</h2>
      <p className="alerts-sub">Spoiled fruit warnings from past readings</p>

      {alerts.length > 0 ? (
        <div className="alerts-grid">
          {alerts.map((a, i) => (
            <div key={i} className="alert-card">
              <p className="alert-fruit">{a.fruit}</p>
              <p className="alert-status">⚠️ Spoiled</p>
              <p className="alert-detail">MQ135: {a.mq135} · MQ4: {a.mq4} · MQ3: {a.mq3}</p>
              <p className="alert-detail">Temp: {a.temperature}°C · Humidity: {a.humidity}%</p>
              <p className="alert-time">{a.timestamp}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="alerts-empty">No spoiled readings yet. Good job keeping things fresh! 🍊</p>
      )}
    </div>
  </div>
)
}

export default Alerts