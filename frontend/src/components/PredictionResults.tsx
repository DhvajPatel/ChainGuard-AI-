import { Clock, AlertTriangle, CheckCircle2, TrendingUp, Route, Sparkles, Zap, Lightbulb, Shield, Target, Truck, CloudRain, Navigation as NavigationIcon } from "lucide-react";
import type { PredictResponse } from "../api";
import StatusBadge from "./StatusBadge";

interface PredictionResultsProps {
  result: PredictResponse;
}

// Map risk levels to colors for badges
const riskColors: Record<string, "green" | "yellow" | "red"> = {
  Low: "green",
  Medium: "yellow",
  High: "red",
  Critical: "red",
};

// Map risk levels to gradient colors for visual indicators
const riskGradients: Record<string, string> = {
  Low: "from-green-600 to-emerald-600",
  Medium: "from-yellow-600 to-amber-600",
  High: "from-orange-600 to-red-600",
  Critical: "from-red-600 to-rose-600",
};

export default function PredictionResults({ result }: PredictionResultsProps) {
  const riskColor = riskColors[result.risk_level] || "yellow";

  // Generate actionable solutions based on disruption factors
  const getSolutions = () => {
    const solutions = [];
    
    // Check for traffic-related issues
    if (result.disruption_factors.some(f => f.toLowerCase().includes('traffic') || f.toLowerCase().includes('congestion'))) {
      solutions.push({
        icon: NavigationIcon,
        title: "Route Optimization",
        description: "Switch to alternative routes with lower traffic density",
        impact: "Reduce delay by 20-40%",
        color: "cyan",
        actions: [
          "Use real-time traffic data to avoid congested areas",
          "Consider off-peak delivery times",
          "Implement dynamic routing algorithms"
        ]
      });
    }

    // Check for weather-related issues
    if (result.disruption_factors.some(f => f.toLowerCase().includes('weather') || f.toLowerCase().includes('rain') || f.toLowerCase().includes('storm'))) {
      solutions.push({
        icon: CloudRain,
        title: "Weather Contingency",
        description: "Implement weather-aware scheduling and routing",
        impact: "Reduce delay by 15-30%",
        color: "blue",
        actions: [
          "Monitor weather forecasts and adjust schedules proactively",
          "Use weather-resistant vehicles for adverse conditions",
          "Build buffer time for weather-prone routes"
        ]
      });
    }

    // Check for vehicle-related issues
    if (result.disruption_factors.some(f => f.toLowerCase().includes('vehicle') || f.toLowerCase().includes('maintenance'))) {
      solutions.push({
        icon: Truck,
        title: "Fleet Management",
        description: "Optimize vehicle selection and maintenance",
        impact: "Reduce delay by 10-25%",
        color: "green",
        actions: [
          "Implement predictive maintenance schedules",
          "Match vehicle type to cargo and route requirements",
          "Maintain backup vehicles for critical shipments"
        ]
      });
    }

    // Always include AI optimization
    solutions.push({
      icon: Sparkles,
      title: "AI-Powered Optimization",
      description: "Leverage machine learning for continuous improvement",
      impact: "Reduce delay by 25-50%",
      color: "purple",
      actions: [
        "Use historical data to predict and prevent delays",
        "Implement real-time decision support systems",
        "Automate route adjustments based on live conditions"
      ]
    });

    // Add proactive monitoring
    solutions.push({
      icon: Shield,
      title: "Proactive Monitoring",
      description: "Early detection and intervention systems",
      impact: "Prevent 60% of delays",
      color: "yellow",
      actions: [
        "Set up automated alerts for risk threshold breaches",
        "Monitor shipments in real-time with IoT sensors",
        "Establish rapid response protocols for disruptions"
      ]
    });

    return solutions;
  };

  const solutions = getSolutions();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header with Key Metrics */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
        <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <TrendingUp size={24} className="text-cyan-400" />
          </div>
          AI Prediction Analysis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delay Probability Card */}
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/30 rounded-xl p-6 overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">Delay Probability</p>
                  <p className="text-5xl font-black text-white">
                    {result.delay_probability.toFixed(1)}
                    <span className="text-2xl text-slate-400">%</span>
                  </p>
                </div>
                <StatusBadge status={result.risk_level} color={riskColor} />
              </div>
              <div className="mt-4">
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                  <div
                    className={`h-full bg-gradient-to-r ${riskGradients[result.risk_level]} transition-all duration-1000 shadow-lg`}
                    style={{ 
                      width: `${Math.min(result.delay_probability, 100)}%`,
                      boxShadow: `0 0 20px ${result.delay_probability >= 65 ? 'rgba(239, 68, 68, 0.5)' : result.delay_probability >= 35 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Expected Delay Card */}
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-500/30 rounded-xl p-6 overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-500/20">
                <Clock className="text-blue-400" size={28} />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">Expected Delay</p>
                <p className="text-5xl font-black text-white">
                  {Math.round(result.expected_delay_minutes)}
                  <span className="text-xl text-slate-400 ml-2">min</span>
                </p>
                <p className="text-slate-500 text-sm mt-2 font-medium">
                  ≈ {(result.expected_delay_minutes / 60).toFixed(1)} hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disruption Factors */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/10">
        <div className="px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-900/40 to-orange-900/40">
          <h4 className="text-white font-bold text-lg flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-400" />
            Disruption Factors
          </h4>
        </div>
        <div className="p-6">
          {result.disruption_factors.length > 0 ? (
            <ul className="space-y-3">
              {result.disruption_factors.map((factor, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 text-slate-300 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg animate-in fade-in slide-in-from-left duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 shadow-lg shadow-yellow-400/50" />
                  <span className="font-medium">{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-3 text-green-400 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 size={20} />
              <span className="font-semibold">No significant disruption factors detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Route Options Comparison */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
          <h4 className="text-white font-bold text-lg flex items-center gap-2">
            <Route size={20} className="text-cyan-400" />
            Smart Route Options
          </h4>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {result.route_options.map((option, index) => {
              const isRecommended = option.recommended;
              const optionRiskColor = riskColors[option.risk_level] || "yellow";

              return (
                <div
                  key={index}
                  className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-right ${
                    isRecommended
                      ? "border-green-500/50 ring-2 ring-green-500/30 shadow-xl shadow-green-500/20"
                      : "border-slate-700/50 hover:border-slate-600"
                  }`}
                  style={{ animationDelay: `${index * 150}ms`, animationDuration: '500ms' }}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/50 flex items-center gap-1.5 animate-pulse">
                      <Sparkles size={14} />
                      AI RECOMMENDED
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Route Name */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className={isRecommended ? "text-green-400" : "text-slate-500"} />
                        <h5 className="text-white font-bold text-base">{option.route}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={option.risk_level} color={optionRiskColor} />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex gap-8">
                      <div>
                        <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Risk</p>
                        <p className="text-white font-bold text-lg">
                          {option.delay_probability.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Delay</p>
                        <p className="text-white font-bold text-lg">
                          {Math.round(option.estimated_delay_minutes)}m
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                      <div
                        className={`h-full bg-gradient-to-r ${riskGradients[option.risk_level]} transition-all duration-1000`}
                        style={{ 
                          width: `${Math.min(option.delay_probability, 100)}%`,
                          boxShadow: `0 0 15px ${option.delay_probability >= 65 ? 'rgba(239, 68, 68, 0.5)' : option.delay_probability >= 35 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Note */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
              <p className="text-slate-300 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span className="font-medium">
                  <span className="font-bold text-green-400">{result.recommended_route}</span> is
                  the optimal choice with the lowest expected delay of{" "}
                  <span className="font-bold text-white">
                    {Math.round(
                      result.route_options.find((r) => r.recommended)?.estimated_delay_minutes || 0
                    )} minutes
                  </span>
                  . AI analysis suggests immediate route switching for maximum efficiency.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Solve/Reduce Delays Section */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
        <div className="px-6 py-4 border-b border-green-500/20 bg-gradient-to-r from-green-900/40 to-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Lightbulb size={24} className="text-green-400" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xl">How to Solve & Reduce Delays</h4>
              <p className="text-green-400/80 text-sm">AI-recommended solutions based on your prediction</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {solutions.map((solution, index) => {
              const colorMap = {
                cyan: {
                  border: "border-cyan-500/30",
                  bg: "from-cyan-500/5 to-cyan-600/5",
                  iconBg: "bg-cyan-500/20",
                  iconColor: "text-cyan-400",
                  textColor: "text-cyan-400"
                },
                blue: {
                  border: "border-blue-500/30",
                  bg: "from-blue-500/5 to-blue-600/5",
                  iconBg: "bg-blue-500/20",
                  iconColor: "text-blue-400",
                  textColor: "text-blue-400"
                },
                green: {
                  border: "border-green-500/30",
                  bg: "from-green-500/5 to-green-600/5",
                  iconBg: "bg-green-500/20",
                  iconColor: "text-green-400",
                  textColor: "text-green-400"
                },
                purple: {
                  border: "border-purple-500/30",
                  bg: "from-purple-500/5 to-purple-600/5",
                  iconBg: "bg-purple-500/20",
                  iconColor: "text-purple-400",
                  textColor: "text-purple-400"
                },
                yellow: {
                  border: "border-yellow-500/30",
                  bg: "from-yellow-500/5 to-yellow-600/5",
                  iconBg: "bg-yellow-500/20",
                  iconColor: "text-yellow-400",
                  textColor: "text-yellow-400"
                }
              };

              const colors = colorMap[solution.color as keyof typeof colorMap];

              return (
                <div
                  key={index}
                  className={`relative bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-6 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 animate-in fade-in slide-in-from-bottom`}
                  style={{ animationDelay: `${index * 100}ms`, animationDuration: '500ms' }}
                >
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${colors.iconBg} p-3 rounded-xl border ${colors.border} shadow-lg`}>
                      <solution.icon size={24} className={colors.iconColor} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white font-bold text-lg mb-1">{solution.title}</h5>
                      <p className="text-slate-400 text-sm">{solution.description}</p>
                    </div>
                  </div>

                  {/* Impact Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${colors.iconBg} border ${colors.border} rounded-full mb-4`}>
                    <Target size={14} className={colors.iconColor} />
                    <span className={`${colors.textColor} text-xs font-bold uppercase tracking-wider`}>
                      {solution.impact}
                    </span>
                  </div>

                  {/* Action Items */}
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Action Items:</p>
                    {solution.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${colors.iconBg} mt-1.5 flex-shrink-0`} />
                        <p className="text-slate-300 text-sm">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Card */}
          <div className="mt-6 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle2 size={28} className="text-green-400" />
              </div>
              <div className="flex-1">
                <h5 className="text-white font-bold text-lg mb-2">Recommended Action Plan</h5>
                <p className="text-slate-300 mb-4">
                  By implementing these AI-recommended solutions, you can potentially reduce delays by up to{" "}
                  <span className="text-green-400 font-bold">50-70%</span> and improve overall delivery performance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-green-500/20">
                    <p className="text-green-400 text-2xl font-bold">50-70%</p>
                    <p className="text-slate-400 text-xs">Delay Reduction</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-green-500/20">
                    <p className="text-green-400 text-2xl font-bold">60%</p>
                    <p className="text-slate-400 text-xs">Prevention Rate</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-green-500/20">
                    <p className="text-green-400 text-2xl font-bold">Real-time</p>
                    <p className="text-slate-400 text-xs">Monitoring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
