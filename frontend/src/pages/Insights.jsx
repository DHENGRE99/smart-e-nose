import Navbar from "../components/Navbar"
import { useEffect, useState } from "react"
import { getHistory } from "../services/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import "./Insights.css"

function Insights() {
  const [chartData, setChartData] = useState([])
  const [keyInsight, setKeyInsight] = useState(null)

  useEffect(() => {
    getHistory().then(data => {
      const records = data.records || []
      const groups = { Fresh: [], Medium: [], Spoiled: [] }
      records.forEach(r => { if (groups[r.freshness]) groups[r.freshness].push(r) })

      const avg = (arr, key) => arr.length ? arr.reduce((sum, r) => sum + r[key], 0) / arr.length : 0
      const sensors = ["mq135", "mq4", "mq3"]

      const data2 = sensors.map(sensor => ({
        sensor: sensor.toUpperCase(),
        Fresh: Math.round(avg(groups.Fresh, sensor)),
        Medium: Math.round(avg(groups.Medium, sensor)),
        Spoiled: Math.round(avg(groups.Spoiled, sensor))
      }))

      setChartData(data2)

      const gaps = data2.map(d => ({ sensor: d.sensor, gap: Math.abs(d.Spoiled - d.Fresh) }))
      const topSensor = gaps.sort((a, b) => b.gap - a.gap)[0]
      if (topSensor && topSensor.gap > 0) {
        setKeyInsight(`${topSensor.sensor} shows the biggest difference between fresh and spoiled samples — making it your most reliable spoilage signal.`)
      }
    })
  }, [])

  return (
    <div className="insights">
      <Navbar />
      <div className="insights-body">
        <h2 className="insights-title">Insights</h2>
        <p className="insights-sub">Sensor correlation · spoilage patterns · key signals</p>

        {keyInsight && (
          <div className="insights-callout">
            <span className="insights-callout-icon">💡</span>
            <p>{keyInsight}</p>
          </div>
        )}

        <div className="insights-chart-card">
          <h3>Average Sensor Values by Freshness Category</h3>
          <p className="insights-chart-sub">Which sensor shows the biggest gap between Fresh and Spoiled?</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="sensor" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Fresh" fill="#588157" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Medium" fill="#a3b18a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spoiled" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="insights-empty">No data yet. Run some scans first to see patterns!</p>
          )}
        </div>

        <div className="insights-tip-row">
          <div className="insights-tip-card">
            <p className="insights-tip-icon">🧪</p>
            <h4>MQ-135</h4>
            <p>Detects ammonia and CO₂ — gases that rise sharply as citrus skin breaks down.</p>
          </div>
          <div className="insights-tip-card">
            <p className="insights-tip-icon">🔥</p>
            <h4>MQ-4</h4>
            <p>Picks up methane from bacterial decomposition — a late-stage spoilage marker.</p>
          </div>
          <div className="insights-tip-card">
            <p className="insights-tip-icon">🍷</p>
            <h4>MQ-3</h4>
            <p>Ethanol vapors rise when fruit ferments — an early warning sign before visible spoilage.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights