import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import Analytics from "./pages/Analytics"
import Alerts from "./pages/Alerts"
import LiveMonitor from "./pages/LiveMonitor"
import Insights from "./pages/Insights"
import Devices from "./pages/Devices"
import About from "./pages/About"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/live-monitor" element={<LiveMonitor />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App