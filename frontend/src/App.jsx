import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Activity, BarChart3, Gauge, Settings as SettingsIcon } from "lucide-react";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

/** Application shell with persistent navigation and global user/risk state. */
export default function App() {
  const [userId, setUserId] = useState(1);
  const [userName, setUserName] = useState("Demo Driver");
  const [currentRisk, setCurrentRisk] = useState("Safe");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <Gauge size={22} />
          <span>Fatigue AI</span>
        </div>

        {/* Navigation */}
        <nav>
          <NavLink to="/" end>
            <Activity size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/analytics">
            <BarChart3 size={16} />
            Analytics
          </NavLink>
          <NavLink to="/settings">
            <SettingsIcon size={16} />
            Settings
          </NavLink>
        </nav>

        {/* Live risk indicator */}
        <div
          className={`risk-chip ${currentRisk.toLowerCase()}`}
          title={`Current risk: ${currentRisk}`}
        >
          {currentRisk}
        </div>
      </aside>

      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              userId={userId}
              userName={userName}
              onRiskChange={setCurrentRisk}
            />
          }
        />
        <Route path="/analytics" element={<Analytics userId={userId} />} />
        <Route
          path="/settings"
          element={
            <Settings
              userId={userId}
              setUserId={setUserId}
              userName={userName}
              setUserName={setUserName}
            />
          }
        />
      </Routes>
    </div>
  );
}
