import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, Outlet } from "react-router-dom";
import { Activity, BarChart3, Moon, Settings as SettingsIcon, Sun, ShieldCheck } from "lucide-react";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";

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

/** Layout for dashboard pages with sidebar and global state. */
function DashboardLayout({ currentRisk }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-orb flex items-center justify-center">
             <ShieldCheck size={14} className="text-white" strokeWidth={3} />
          </div>
          <span>DriveGuard</span>
        </div>

        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
            <Activity size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? "active" : ""}>
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
            <SettingsIcon size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className={`risk-chip ${currentRisk.toLowerCase()}`} title={`Current risk: ${currentRisk}`}>
          {currentRisk}
        </div>
      </aside>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

/** Root Application Component. */
export default function App() {
  const [userId, setUserId] = useState(1);
  const [userName, setUserName] = useState("Demo Driver");
  const [currentRisk, setCurrentRisk] = useState("Safe");
  const location = useLocation();
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Hide global toggle on landing page to use an integrated one
  const isLanding = location.pathname === "/";

  return (
    <>
      {!isLanding && <ThemeToggle theme={theme} setTheme={setTheme} />}
      
      <Routes>
        <Route path="/" element={<Landing theme={theme} setTheme={setTheme} />} />
        
        <Route element={<DashboardLayout currentRisk={currentRisk} />}>
          <Route
            path="/dashboard"
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
        </Route>
      </Routes>
    </>
  );
}
