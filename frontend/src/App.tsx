import { useState, useEffect, memo } from "react";
import { LayoutDashboard, Brain, BarChart3 } from "lucide-react";
import Dashboard from "./components/Dashboard";
import PredictionForm from "./components/PredictionForm";
import PredictionResults from "./components/PredictionResults";
import Analytics from "./components/Analytics";
import ThemeToggle from "./components/ThemeToggle";
import type { PredictResponse } from "./api";

// Memoized components to prevent unnecessary re-renders
const MemoizedDashboard = memo(Dashboard);
const MemoizedPredictionForm = memo(PredictionForm);
const MemoizedPredictionResults = memo(PredictionResults);
const MemoizedAnalytics = memo(Analytics);

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "predict" | "analytics">("dashboard");
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // Changed default to dark
  
  // Shared dashboard data state
  const [sharedDashboardData, setSharedDashboardData] = useState<any>(null);

  // Listen for dashboard data changes from localStorage
  useEffect(() => {
    const loadSharedData = () => {
      const savedData = localStorage.getItem('chainguard_dashboard_data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const timestamp = parsed.timestamp;
          
          // Only update if data actually changed (compare timestamps)
          setSharedDashboardData((prev: any) => {
            if (!prev || prev.timestamp !== timestamp) {
              return parsed;
            }
            return prev;
          });
        } catch (err) {
          console.error('Failed to load shared data:', err);
        }
      }
    };

    // Load initially
    loadSharedData();

    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chainguard_dashboard_data') {
        loadSharedData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates (more efficient than polling)
    const handleCustomUpdate = () => {
      loadSharedData();
    };
    
    window.addEventListener('dashboardDataUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboardDataUpdated', handleCustomUpdate);
    };
  }, []);

  // Load prediction result from localStorage on mount
  useEffect(() => {
    const savedPrediction = localStorage.getItem('chainguard_prediction');
    if (savedPrediction) {
      try {
        setPredictionResult(JSON.parse(savedPrediction));
      } catch (err) {
        console.error('Failed to restore prediction:', err);
      }
    }
  }, []);

  // Save prediction result to localStorage whenever it changes
  useEffect(() => {
    if (predictionResult) {
      localStorage.setItem('chainguard_prediction', JSON.stringify(predictionResult));
    }
  }, [predictionResult]);

  // Optimize clock updates - only update when seconds change
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Schedule next update at the start of next second
      const msUntilNextSecond = 1000 - now.getMilliseconds();
      return setTimeout(updateClock, msUntilNextSecond);
    };
    
    const timeoutId = updateClock();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Load theme from localStorage, default to dark if not set
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Set default theme to dark in localStorage
      localStorage.setItem("theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      theme === "light" ? "light-theme" : ""
    } ${
      theme === "light"
        ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-900"
        : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
    }`}>
      {/* Animated Background Grid - Optimized */}
      <div className={`fixed inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none ${
        theme === "light" ? "opacity-40" : "opacity-100"
      }`} />
      
      {/* Glow Effects - Optimized with will-change */}
      <div className={`fixed top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        theme === "light" ? "bg-blue-400/20" : "bg-blue-500/5"
      }`} style={{ willChange: 'opacity' }} />
      <div className={`fixed bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        theme === "light" ? "bg-purple-400/20" : "bg-cyan-500/5"
      }`} style={{ willChange: 'opacity' }} />
      <div className={`fixed top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        theme === "light" ? "bg-indigo-400/15" : "bg-purple-500/3"
      }`} style={{ willChange: 'opacity' }} />

      {/* Header */}
      <header className={`relative border-b backdrop-blur-xl sticky top-0 z-50 shadow-lg transition-colors duration-500 ${
        theme === "light"
          ? "bg-white/80 border-blue-300 shadow-blue-300/30"
          : "bg-slate-900/40 border-cyan-500/20 shadow-cyan-500/5"
      }`}>
        <div className="max-w-[1920px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="/logo.svg" 
                    alt="ChainGuard AI Logo" 
                    className="w-12 h-12 drop-shadow-lg"
                  />
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse shadow-lg ${
                    theme === "light" ? "bg-green-500 shadow-green-500/60" : "bg-green-400 shadow-green-400/50"
                  }`} />
                </div>
                <div>
                  <h1 className={`text-3xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${
                    theme === "light"
                      ? "from-blue-700 via-indigo-700 to-purple-700"
                      : "from-cyan-400 via-blue-400 to-purple-400"
                  }`}>
                    ChainGuard AI
                  </h1>
                  <p className={`text-xs font-semibold tracking-wider uppercase ${
                    theme === "light" ? "text-indigo-700" : "text-cyan-400/80"
                  }`}>
                    Predict. Prevent. Optimize.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Theme Toggle */}
              <ThemeToggle theme={theme} onToggle={toggleTheme} />

              {/* Real-time Clock */}
              <div className={`px-4 py-2 rounded-lg backdrop-blur-sm border shadow-lg ${
                theme === "light"
                  ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-400 shadow-blue-400/30"
                  : "bg-slate-800/50 border-cyan-500/30"
              }`}>
                <div className={`text-sm font-mono font-bold tracking-wider ${
                  theme === "light" ? "text-indigo-800" : "text-cyan-400"
                }`}>
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={`relative border-b backdrop-blur-xl sticky top-[73px] z-40 transition-colors duration-500 ${
        theme === "light"
          ? "bg-white/90 border-indigo-200 shadow-md shadow-indigo-200/20"
          : "bg-slate-900/60 border-cyan-500/20"
      }`}>
        <div className="max-w-[1920px] mx-auto px-8">
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 relative ${
                activeTab === "dashboard"
                  ? theme === "light"
                    ? "border-blue-600 text-blue-700 bg-gradient-to-r from-blue-100 to-indigo-100"
                    : "border-cyan-400 text-cyan-400 bg-cyan-500/10"
                  : theme === "light"
                    ? "border-transparent text-slate-700 hover:text-blue-700 hover:bg-blue-50"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/40"
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="uppercase tracking-wider">Dashboard</span>
              {activeTab === "dashboard" && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent to-transparent ${
                  theme === "light" ? "via-blue-600" : "via-cyan-400"
                }`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab("predict")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 relative ${
                activeTab === "predict"
                  ? theme === "light"
                    ? "border-purple-600 text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100"
                    : "border-purple-400 text-purple-400 bg-purple-500/10"
                  : theme === "light"
                    ? "border-transparent text-slate-700 hover:text-purple-700 hover:bg-purple-50"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/40"
              }`}
            >
              <Brain size={18} />
              <span className="uppercase tracking-wider">AI Predict</span>
              {activeTab === "predict" && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent to-transparent ${
                  theme === "light" ? "via-purple-600" : "via-purple-400"
                }`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 relative ${
                activeTab === "analytics"
                  ? theme === "light"
                    ? "border-indigo-600 text-indigo-700 bg-gradient-to-r from-indigo-100 to-blue-100"
                    : "border-blue-400 text-blue-400 bg-blue-500/10"
                  : theme === "light"
                    ? "border-transparent text-slate-700 hover:text-indigo-700 hover:bg-indigo-50"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/40"
              }`}
            >
              <BarChart3 size={18} />
              <span className="uppercase tracking-wider">Analytics</span>
              {activeTab === "analytics" && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent to-transparent ${
                  theme === "light" ? "via-indigo-600" : "via-blue-400"
                }`} />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-[1920px] mx-auto px-8 py-8">
        {activeTab === "dashboard" && <MemoizedDashboard />}
        {activeTab === "predict" && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Single Prediction Form */}
            <MemoizedPredictionForm 
              onPredictionResult={setPredictionResult} 
              sharedData={sharedDashboardData}
            />
            {predictionResult && (
              <div className="animate-in fade-in slide-in-from-bottom duration-500">
                <MemoizedPredictionResults result={predictionResult} />
              </div>
            )}
          </div>
        )}
        {activeTab === "analytics" && <MemoizedAnalytics sharedData={sharedDashboardData} />}
      </main>
    </div>
  );
}
