import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"
import "./Home.css"

function Home() {
  const navigate = useNavigate()

  return (
    <div>
      <Navbar />
      <div className="hero">
        <div className="hero-text">
          <p className="hero-tag">Certified Organic Detection</p>
          <h1>From Fresh Fields<br />To Safe Tables</h1>
          <p className="hero-desc">
            Smart E-Nose detects citrus fruit freshness using
            gas sensors and machine learning — built for farmers
            and consumers of Nagpur.
          </p>
          <button className="hero-btn" onClick={() => navigate("/dashboard")}>
            Check Freshness
          </button>
          <div className="hero-stats">
            <div className="stat">
              <h3>3</h3>
              <p>Gas Sensors</p>
            </div>
            <div className="stat">
              <h3>98%</h3>
              <p>Accuracy</p>
            </div>
            <div className="stat">
              <h3>2</h3>
              <p>Fruits Supported</p>
            </div>
          </div>
        </div>
        <div className="hero-image">
          🍊
        </div>
      </div>
    </div>
  )
}

export default Home