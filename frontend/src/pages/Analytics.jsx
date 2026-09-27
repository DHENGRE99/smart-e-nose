import Navbar from "../components/Navbar"
import { useEffect, useState } from "react"
import { getAnalytics, getHistory } from "../services/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import "./Analytics.css"

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    getAnalytics().then(setAnalytics)
    getHistory().then(data => setHistory(data.records || []))
  }, [])

  const pieData = analytics ? [
    { name: "Fresh", value: analytics.fresh_count },
    { name: "Medium", value: analytics.medium_count },
    { name: "Spoiled", value: analytics.spoiled_count },
  ] : []

  const COLORS = ["#588157", "#a3b18a", "#dc2626"]

  return (
    <div className="analytics">
      <Navbar />
      <div className="analytics-body">
        <h2 className="analytics-title">Analytics</h2>
        <p className="analytics-sub">Trends · sensor performance · waste reduction</p>

        <div className="analytics-kpi-row">
          <div className="analytics-kpi">
            <p className="analytics-kpi-label">SAMPLES ANALYZED</p>
            <h2>{analytics ? analytics.total_readings : "--"}</h2>
          </div>
          <div className="analytics-kpi">
            <p className="analytics-kpi-label">FRESH COUNT</p>
            <h2 style={{ color: "#588157" }}>{analytics ? analytics.fresh_count : "--"}</h2>
          </div>
          <div className="analytics-kpi">
            <p className="analytics-kpi-label">SPOILED COUNT</p>
            <h2 style={{ color: "#dc2626" }}>{analytics ? analytics.spoiled_count : "--"}</h2>
          </div>
          <div className="analytics-kpi">
            <p className="analytics-kpi-label">FRESH PERCENT</p>
            <h2 style={{ color: "#588157" }}>{analytics ? `${analytics.fresh_percent}%` : "--"}</h2>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Category Breakdown</h3>
            {analytics && analytics.total_readings > 0 ? (
              <PieChart width={200} height={200}>
                <Pie data={pieData} cx={100} cy={100} innerRadius={60} outerRadius={90} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <p className="analytics-empty">No data yet. Run some scans first!</p>
            )}
            <div className="analytics-legend">
              <span style={{ color: "#588157" }}>● Fresh {analytics ? analytics.fresh_percent : 0}%</span>
              <span style={{ color: "#a3b18a" }}>● Medium</span>
              <span style={{ color: "#dc2626" }}>● Spoiled {analytics ? analytics.spoiled_percent : 0}%</span>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Sensor Accuracy</h3>
            <div className="analytics-sensor-bars">
              {[
                { label: "MQ-3 · Ethanol", value: 98 },
                { label: "MQ-135 · NH₃", value: 96 },
                { label: "MQ-4 · Methane", value: 94 },
                { label: "DHT22 · Temp/Humidity", value: 99 },
              ].map(s => (
                <div key={s.label} className="analytics-bar-item">
                  <div className="analytics-bar-label">
                    <span>{s.label}</span>
                    <span>{s.value}%</span>
                  </div>
                  <div className="analytics-bar-track">
                    <div className="analytics-bar-fill" style={{ width: `${s.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card full-width">
            <h3>Recent Readings</h3>
            {history.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Fruit</th>
                    <th>MQ135</th>
                    <th>MQ4</th>
                    <th>MQ3</th>
                    <th>Temp</th>
                    <th>Humidity</th>
                    <th>Status</th>
                    <th>Shelf Life</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-10).reverse().map((r, i) => (
                    <tr key={i}>
                      <td>{r.fruit}</td>
                      <td>{r.mq135}</td>
                      <td>{r.mq4}</td>
                      <td>{r.mq3}</td>
                      <td>{r.temperature}°C</td>
                      <td>{r.humidity}%</td>
                      <td style={{ color: r.freshness === "Fresh" ? "#588157" : r.freshness === "Medium" ? "#f59e0b" : "#dc2626", fontWeight: 700 }}>
                        {r.freshness}
                      </td>
                      <td>{r.shelf_life_days} days</td>
                      <td>{r.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="analytics-empty">No readings yet. Run some scans first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics