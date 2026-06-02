import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Activity, 
  Shield, 
  ShieldCheck,
  Zap, 
  BarChart3, 
  Code, 
  ArrowRight, 
  Eye, 
  Smartphone, 
  AlertTriangle,
  ChevronRight,
  MousePointer2,
  Sun,
  Moon
} from "lucide-react";

/** 
 * Premium SaaS Landing Page for DriveGuard.
 * Uses Glassmorphism, modern gradients, and intentional motion.
 */
export default function Landing({ theme, setTheme }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="landing-container bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen selection:bg-[var(--accent)] selection:text-white transition-colors duration-500">
      {/* ─── Navigation ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 ${
        scrolled ? "bg-[var(--bg-card)] backdrop-blur-xl border-b border-[var(--border)] py-3" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight group cursor-pointer">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-[var(--accent-gradient)] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-full h-full bg-[var(--bg-card)] border border-[var(--border-bright)] rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck size={22} className="text-[var(--accent)]" strokeWidth={2.5} />
              </div>
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
              DriveGuard
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">How it Works</a>
            <a href="#preview" className="hover:text-[var(--text-primary)] transition-colors">Preview</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-elevated)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <a 
              href="https://github.com/Pmskabir1234/DriveGuard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Code size={20} />
            </a>
            <Link 
              to="/dashboard" 
              className="primary-btn !py-2.5 !px-5 !text-sm flex items-center gap-2 group"
            >
              View Demo
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-gradient)] opacity-10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-[var(--moderate)] opacity-5 blur-[100px] rounded-full" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-semibold mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            Real-time Driver Monitoring AI
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-8 leading-[1.1]">
            Safety at the <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] via-[#7C3AED] to-[#00D4FF]">
              Speed of Sight.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--text-secondary)] mb-10 leading-relaxed">
            DriveGuard uses advanced computer vision to monitor driver fatigue, drowsiness, and distraction in real-time. Keep your eyes on the road, while we keep ours on you.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/dashboard" 
              className="primary-btn !py-4 !px-8 text-lg flex items-center gap-2 shadow-2xl"
            >
              Launch Demo Dashboard
              <ArrowRight size={20} />
            </Link>
            <a 
              href="https://github.com/Pmskabir1234/DriveGuard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-[var(--radius-sm)] border border-[var(--border)] font-semibold hover:bg-[var(--bg-elevated)] transition-all"
            >
              <Code size={20} />
              Star on GitHub
            </a>
          </div>
          
          {/* Dashboard Preview Component */}
          <div className="mt-20 relative max-w-5xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-[#7C3AED] rounded-[var(--radius)] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative panel aspect-video flex items-center justify-center bg-[#050816] overflow-hidden">
               <img 
                src="https://github.com/user-attachments/assets/760273d1-ec99-49ed-887d-3c64547aa4e3" 
                alt="DriveGuard Dashboard Preview" 
                className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent opacity-60" />
               <div className="absolute bottom-8 left-8 text-left">
                  <div className="flex items-center gap-2 text-[var(--safe)] font-bold text-sm mb-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--safe)] animate-pulse" />
                    SYSTEM ACTIVE
                  </div>
                  <h3 className="text-white text-2xl font-bold tracking-tight">Intelligent Risk Scoring</h3>
               </div>
               <Link 
                to="/dashboard"
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm"
               >
                 <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                    <MousePointer2 size={24} />
                 </div>
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Product Showcase ─── */}
      <section id="features" className="py-24 bg-[var(--bg-elevated)]/30 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Precision Monitoring</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              Our AI engine processes multiple high-fidelity signals to build a comprehensive map of driver state.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Eye className="text-[var(--accent)]" />}
              title="Drowsiness Detection"
              description="Real-time Eye Aspect Ratio (EAR) analysis detects microsleeps and onset of fatigue before accidents happen."
            />
            <FeatureCard 
              icon={<Zap className="text-[var(--moderate)]" />}
              title="Yawn Frequency"
              description="Continuous tracking of Mouth Aspect Ratio (MAR) to identify physical signs of exhaustion."
            />
            <FeatureCard 
              icon={<Shield className="text-[var(--safe)]" />}
              title="Head Pose Estimation"
              description="3D orientation tracking ensures the driver's focus remains on the road, alerting on prolonged distraction."
            />
            <FeatureCard 
              icon={<Smartphone className="text-[#A855F7]" />}
              title="Distraction Proxy"
              description="Intelligent hand-tracking identifies potential mobile phone use or other obstructive behaviors."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-[#00D4FF]" />}
              title="Explainable AI (XAI)"
              description="Not just a score. DriveGuard explains exactly why an alert was triggered, identifying the primary risk factor."
            />
            <FeatureCard 
              icon={<Activity className="text-[var(--high)]" />}
              title="Historical Trends"
              description="Analyze driver performance over time with deep insights into risk frequency and session health."
            />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold mb-6">
                THE WORKFLOW
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                From Raw Frames to <br /> Life-Saving Alerts.
              </h2>
              
              <div className="space-y-8">
                <WorkflowStep 
                  number="01" 
                  title="Webcam Feed Acquisition" 
                  description="DriveGuard captures standard video frames from any basic webcam at up to 60 FPS." 
                />
                <WorkflowStep 
                  number="02" 
                  title="MediaPipe Neural Processing" 
                  description="On-device inference extracts 468+ face landmarks and 21 hand landmarks using Google's MediaPipe." 
                />
                <WorkflowStep 
                  number="03" 
                  title="Heuristic Analysis & Scoring" 
                  description="Custom algorithms compute EAR, MAR, and gaze vectors to feed into our weighted fatigue scorer." 
                />
                <WorkflowStep 
                  number="04" 
                  title="Real-time Alert Delivery" 
                  description="WebSocket-driven notifications trigger instant visual and audio alarms when risk thresholds are met." 
                />
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[var(--accent-gradient)] opacity-10 blur-[100px] rounded-full" />
              <div className="panel p-1 border-white/5 bg-black/40 backdrop-blur-2xl">
                <div className="bg-[#0A1022] rounded-[20px] p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                      <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                    </div>
                    <div className="text-[var(--text-muted)] text-xs font-mono">FatigueScorer.py</div>
                  </div>
                  <pre className="text-sm font-mono text-[var(--text-secondary)] leading-relaxed">
                    <code className="text-[var(--accent)]">def</code> compute_risk_score(ear, mar, gaze):<br />
                    &nbsp;&nbsp;ear_score = max(0, (THRESHOLD - ear) / RANGE)<br />
                    &nbsp;&nbsp;mar_score = min(1, mar / MAR_THRESHOLD)<br />
                    &nbsp;&nbsp;<br />
                    &nbsp;&nbsp;total_risk = (ear_score * 0.5) + (mar_score * 0.3) ...<br />
                    &nbsp;&nbsp;<br />
                    <code className="text-[var(--moderate)]">return</code> min(1.0, total_risk)
                  </pre>
                  
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--high)]/10 flex items-center justify-center">
                        <AlertTriangle className="text-[var(--high)]" size={24} />
                      </div>
                      <div>
                        <div className="text-white font-bold">Alert Triggered</div>
                        <div className="text-[var(--text-muted)] text-sm">High Drowsiness Detected (EAR: 0.18)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Highlights ─── */}
      <section id="preview" className="py-24 bg-[var(--bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="panel p-12 flex flex-col justify-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <Activity size={32} />
              </div>
              <h3 className="text-3xl font-bold">Interactive Analytics</h3>
              <p className="text-[var(--text-secondary)] text-lg">
                Track your focus history with high-resolution charts. Visualize fatigue onset trends and session-by-session performance data to understand your limits.
              </p>
              <ul className="space-y-3">
                {['Daily Risk Averages', 'Peak Drowsiness Times', 'Session Summaries', 'Exportable Logs'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium">
                    <ChevronRight size={16} className="text-[var(--accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="panel p-12 flex flex-col justify-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[var(--moderate)]/10 flex items-center justify-center text-[var(--moderate)]">
                <Shield size={32} />
              </div>
              <h3 className="text-3xl font-bold">Smart Calibration</h3>
              <p className="text-[var(--text-secondary)] text-lg">
                One size doesn't fit all. Our calibration engine learns your unique eye blink patterns and mouth range to minimize false positives and maximize safety.
              </p>
              <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Calibration Status</span>
                  <span className="text-xs font-bold text-[var(--safe)]">OPTIMIZED</span>
                </div>
                <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full w-full bg-[var(--safe)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-32 relative overflow-hidden">
         <div className="absolute inset-0 bg-[var(--accent)] opacity-[0.03]" />
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Ready to Drive Safer?</h2>
            <p className="text-xl text-[var(--text-secondary)] mb-12">
              Join the future of driver safety. Experience the DriveGuard demo today and see how AI can protect what matters most.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/dashboard" 
                className="primary-btn !py-5 !px-10 text-xl w-full sm:w-auto"
              >
                Get Started with Demo
              </Link>
              <a 
                href="https://github.com/Pmskabir1234/DriveGuard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-10 py-5 rounded-[var(--radius-sm)] border border-[var(--border)] font-semibold hover:bg-[var(--bg-elevated)] transition-all w-full sm:w-auto"
              >
                View Documentation
              </a>
            </div>
         </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 font-bold text-lg opacity-80 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-gradient)] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <ShieldCheck size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <span>DriveGuard</span>
          </div>
          <div className="text-[var(--text-muted)] text-sm">
            &copy; {new Date().getFullYear()} DriveGuard Team. Built for Ideatex Hackathon.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/saaadkabir/fatigue-detection" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <Code size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="panel p-10 flex flex-col gap-6 hover:translate-y-[-8px] transition-all duration-500">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}

function WorkflowStep({ number, title, description }) {
  return (
    <div className="flex gap-6 group">
      <div className="flex-shrink-0 text-3xl font-black text-[var(--border-bright)] group-hover:text-[var(--accent)] transition-colors duration-500">
        {number}
      </div>
      <div className="pt-1">
        <h4 className="font-bold text-lg mb-2">{title}</h4>
        <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{description}</p>
      </div>
    </div>
  );
}
