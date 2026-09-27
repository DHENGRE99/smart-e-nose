import Navbar from "../components/Navbar"
import "./About.css"

const pinout = [
  { component: "MQ-135 Sensor", pin: "GPIO 34", type: "Analog", purpose: "NH₃ / CO₂ / VOC detection" },
  { component: "MQ-4 Sensor", pin: "GPIO 35", type: "Analog", purpose: "Methane gas detection" },
  { component: "MQ-3 Sensor", pin: "GPIO 4", type: "Digital", purpose: "Ethanol trigger" },
  { component: "DHT11 Sensor", pin: "GPIO 5", type: "Digital", purpose: "Temperature & Humidity" },
  { component: "Buzzer", pin: "GPIO 2", type: "Output", purpose: "Spoilage alert" },
  { component: "LCD SDA", pin: "GPIO 21", type: "I2C", purpose: "Display data line" },
  { component: "LCD SCL", pin: "GPIO 22", type: "I2C", purpose: "Display clock line" },
]

function About() {
  return (
    <div>
      <Navbar />
      <div className="about">
        <h2 className="about-title">Smart E-Nose Based Aroma Shelf Life Detection Using Machine Learning</h2>
        <p className="about-sub">How our citrus freshness detection system works — from hardware sensors to cloud ML predictions</p>

        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">📡</div>
            <h3>ESP32 + Gas Sensors</h3>
            <p>Three MQ sensors (MQ-135, MQ-4, MQ-3) detect ammonia, methane and ethanol gases released by citrus fruits as they age. DHT11 monitors temperature and humidity.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">☁️</div>
            <h3>Cloud Backend</h3>
            <p>ESP32 sends sensor data via HTTP POST to our Flask API every 5 seconds. The data is processed and stored in the cloud for analysis.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🤖</div>
            <h3>ML Prediction</h3>
            <p>Random Forest model trained on citrus sensor data classifies freshness (Fresh / Medium / Spoiled) and predicts remaining shelf life in days.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">📊</div>
            <h3>Real-Time Dashboard</h3>
            <p>Results are displayed live on the website dashboard, with edibility verdicts, trend charts, analytics, and alert history.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">📟</div>
            <h3>LCD Display</h3>
            <p>The I2C LCD on the ESP32 shows real-time sensor values and freshness results directly on the hardware — no computer needed.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🍊</div>
            <h3>Nagpur Focus</h3>
            <p>Built specifically for Nagpur's orange farmers and consumers to reduce post-harvest citrus fruit loss using affordable IoT technology.</p>
          </div>
        </div>

        {/* System Architecture Flow */}
        <div className="about-flow">
          <h3>System Architecture</h3>
          <p className="flow-desc">Complete data flow from fruit sample to edibility result</p>
          <div className="flow-steps">
            <div className="flow-step">🍊 Fruit Sample</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">📡 ESP32 Sensors</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step highlight">☁️ Cloud API</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step highlight">🤖 ML Model</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">📊 Website Dashboard</div>
          </div>
          <div className="flow-steps secondary">
            <div className="flow-step-small">ML result sent back to ESP32</div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">📟 LCD Display</div>
            <div className="flow-arrow">+</div>
            <div className="flow-step">🔔 Buzzer Alert</div>
          </div>
        </div>

        {/* Hardware Pinout Table */}
        <div className="about-pinout">
          <h3>📌 ESP32 Hardware Pinout</h3>
          <table className="about-pinout-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Pin</th>
                <th>Type</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {pinout.map(p => (
                <tr key={p.component}>
                  <td>{p.component}</td>
                  <td><code>{p.pin}</code></td>
                  <td>{p.type}</td>
                  <td>{p.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default About