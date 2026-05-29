import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Activity, BarChart3, Gauge, Moon, Settings as SettingsIcon, Sun } from "lucide-react";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

/** Theme toggle component with premium glassmorphism. */
function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle-container">
      <div className="theme-toggle">
        <button
          className={theme === "light" ? "active" : ""}
          onClick={() => setTheme("light")}
          title="Light Mode"
        >
          <Sun size={18} />
        </button>
        <button
          className={theme === "dark" ? "active" : ""}
          onClick={() => setTheme("dark")}
          title="Dark Mode"
        >
          <Moon size={18} />
        </button>
      </div>
    </div>
  );
}

/** Application shell with persistent navigation and global user/risk state. */
export default function App() {
  const [userId, setUserId] = useState(1);
  const [userName, setUserName] = useState("Demo Driver");
  const [currentRisk, setCurrentRisk] = useState("Safe");
  
  // Theme management
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <ThemeToggle theme={theme} setTheme={setTheme} />
      
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <div className="brand-orb" />
          <span>DriveGuard</span>
        </div>

        {/* Navigation */}
        <nav>
          <NavLink to="/" end>
            <Activity size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/analytics">
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/settings">
            <SettingsIcon size={18} />
            <span>Settings</span>
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
