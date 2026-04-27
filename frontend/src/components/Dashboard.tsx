import { useState } from "react";
import { fetchShipments, fetchStats, fetchWeekly, fetchRiskDist, fetchDelayCauses, type Shipment, type SummaryStats } from "../api";
import ShipmentTable from "./ShipmentTable";
import StatCard from "./StatCard";
import MapView from "./MapView";
import LiveMetrics from "./LiveMetrics";
import AIAssistant from "./AIAssistant";
import PerformanceScore from "./PerformanceScore";
import ActivityFeed from "./ActivityFeed";
import DashboardDataSelector from "./DashboardDataSelector";
import { 
  Package, CheckCircle, AlertTriangle, XCircle,
  CloudRain, Navigation, Zap, Brain, Route, Sparkles,
  AlertCircle, Clock, Download, FileText
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

export default function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [delayCauses, setDelayCauses] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isUploadedData, setIsUploadedData] = useState(false); // Track if data is from upload

  // Process uploaded CSV data into dashboard format
  const processUploadedData = (data: any[]) => {
    // Convert CSV data to Shipment format with all required fields
    const processedShipments: Shipment[] = data.map((row, index) => {
      const delayProb = Math.random() * 100;
      const status = delayProb >= 65 ? 'Delayed' : delayProb >= 35 ? 'At Risk' : 'On Time';
      
      return {
        id: row.id || `SH${String(index + 1).padStart(3, '0')}`,
        origin: row.origin,
        destination: row.destination,
        distance: parseFloat(row.distance) || 0,
        traffic: row.traffic,
        weather: row.weather,
        route_type: row.route_type,
        vehicle_type: row.vehicle_type,
        historical_delay: parseFloat(row.historical_delay) || 0,
        cargo: row.cargo,
        eta_hours: parseFloat(row.eta_hours) || 0,
        delay_probability: delayProb,
        expected_delay_minutes: Math.random() * 60,
        status: status,
        // Add missing required fields with default values
        lat_origin: 40.7128 + (Math.random() - 0.5) * 10,
        lng_origin: -74.0060 + (Math.random() - 0.5) * 20,
        lat_dest: 42.3601 + (Math.random() - 0.5) * 10,
        lng_dest: -71.0589 + (Math.random() - 0.5) * 20,
        status_color: status === 'Delayed' ? 'red' : status === 'At Risk' ? 'yellow' : 'green'
      };
    });

    // Calculate stats
    const total = processedShipments.length;
    const onTime = processedShipments.filter(s => s.status === 'On Time').length;
    const atRisk = processedShipments.filter(s => s.status === 'At Risk').length;
    const delayed = processedShipments.filter(s => s.status === 'Delayed').length;
    const avgDelay = processedShipments.reduce((sum, s) => sum + s.expected_delay_minutes, 0) / total;

    const processedStats: SummaryStats = {
      total,
      on_time: onTime,
      at_risk: atRisk,
      delayed,
      on_time_rate: Math.round((onTime / total) * 100),
      avg_delay_minutes: avgDelay
    };

    // Calculate risk distribution
    const processedRiskData = [
      { name: 'Low Risk', value: processedShipments.filter(s => s.delay_probability < 35).length },
      { name: 'Medium Risk', value: processedShipments.filter(s => s.delay_probability >= 35 && s.delay_probability < 65).length },
      { name: 'High Risk', value: processedShipments.filter(s => s.delay_probability >= 65 && s.delay_probability < 85).length },
      { name: 'Critical', value: processedShipments.filter(s => s.delay_probability >= 85).length }
    ];

    // Calculate delay causes
    const trafficCount = processedShipments.filter(s => s.traffic === 'high' || s.traffic === 'heavy').length;
    const weatherCount = processedShipments.filter(s => s.weather === 'rainy' || s.weather === 'stormy').length;
    const routeCount = processedShipments.filter(s => s.route_type === 'mixed').length;

    const processedDelayCauses = [
      { cause: 'Traffic', count: trafficCount },
      { cause: 'Weather', count: weatherCount },
      { cause: 'Route', count: routeCount },
      { cause: 'Other', count: Math.max(0, delayed - trafficCount - weatherCount - routeCount) }
    ];

    // Generate weekly data (simulated)
    const processedWeeklyData = [
      { day: 'Mon', on_time: Math.floor(onTime * 0.15), delayed: Math.floor(delayed * 0.15) },
      { day: 'Tue', on_time: Math.floor(onTime * 0.18), delayed: Math.floor(delayed * 0.12) },
      { day: 'Wed', on_time: Math.floor(onTime * 0.16), delayed: Math.floor(delayed * 0.18) },
      { day: 'Thu', on_time: Math.floor(onTime * 0.17), delayed: Math.floor(delayed * 0.20) },
      { day: 'Fri', on_time: Math.floor(onTime * 0.19), delayed: Math.floor(delayed * 0.22) },
      { day: 'Sat', on_time: Math.floor(onTime * 0.08), delayed: Math.floor(delayed * 0.08) },
      { day: 'Sun', on_time: Math.floor(onTime * 0.07), delayed: Math.floor(delayed * 0.05) }
    ];

    setShipments(processedShipments);
    setStats(processedStats);
    setRiskData(processedRiskData);
    setDelayCauses(processedDelayCauses);
    setWeeklyData(processedWeeklyData);
    setDataLoaded(true);
    setIsUploadedData(true); // Mark as uploaded data
  };

  const loadData = async () => {
    // Don't reload if we have uploaded data
    if (isUploadedData) return;
    
    try {
      setLoading(true);
      setError(null);
      const [shipmentsData, statsData, riskDist, causes, weekly] = await Promise.all([
        fetchShipments(), 
        fetchStats(),
        fetchRiskDist().catch(() => []),
        fetchDelayCauses().catch(() => []),
        fetchWeekly().catch(() => [])
      ]);
      setShipments(shipmentsData);
      setStats(statsData);
      setRiskData(riskDist);
      setDelayCauses(causes);
      setWeeklyData(weekly);
      setDataLoaded(true);
      setIsUploadedData(false); // Mark as API data
    } catch (err) {
      setError("Failed to load dashboard data. Please ensure the backend is running.");
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDataLoaded = (data?: any[]) => {
    if (data) {
      // Uploaded CSV data
      setLoading(true);
      setTimeout(() => {
        processUploadedData(data);
        setLoading(false);
      }, 500);
    } else {
      // Sample data from backend
      loadData();
      // Set up auto-refresh after initial load
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  };

  const downloadReport = () => {
    if (!stats || shipments.length === 0) return;

    const reportDate = new Date().toLocaleString();
    
    let reportContent = `ChainGuard AI - Dashboard Report
Generated: ${reportDate}
========================================

SUMMARY STATISTICS
------------------
Total Shipments: ${stats.total}
On Time: ${stats.on_time} (${stats.on_time_rate}%)
At Risk: ${stats.at_risk}
Delayed: ${stats.delayed}
Average Delay: ${Math.round(stats.avg_delay_minutes)} minutes

RISK DISTRIBUTION
-----------------
${riskData.map(r => `${r.name}: ${r.value} shipments`).join('\n')}

DELAY CAUSES
------------
${delayCauses.map(d => `${d.cause}: ${d.count} incidents`).join('\n')}

SHIPMENT DETAILS
----------------
${shipments.map(s => `
ID: ${s.id}
Route: ${s.origin} → ${s.destination}
Status: ${s.status}
Delay Probability: ${s.delay_probability.toFixed(1)}%
Expected Delay: ${Math.round(s.expected_delay_minutes)} minutes
Distance: ${s.distance} km
Traffic: ${s.traffic}
Weather: ${s.weather}
Vehicle: ${s.vehicle_type}
Cargo: ${s.cargo}
`).join('\n---\n')}

========================================
Report generated by ChainGuard AI
Predict. Prevent. Optimize.
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChainGuard_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get AI insights based on current data
  const getAIInsights = () => {
    if (!stats || shipments.length === 0) return [];
    
    const insights = [];
    const highRiskShipments = shipments.filter(s => s.delay_probability >= 65);
    const trafficIssues = shipments.filter(s => s.traffic === 'heavy');
    const weatherIssues = shipments.filter(s => s.weather === 'rainy' || s.weather === 'stormy');
    
    if (highRiskShipments.length > 0) {
      insights.push({
        type: 'warning',
        message: `${highRiskShipments.length} shipments at critical risk - immediate action recommended`,
        icon: AlertCircle
      });
    }
    
    if (trafficIssues.length > 3) {
      insights.push({
        type: 'info',
        message: `Heavy congestion detected on ${trafficIssues.length} routes - AI suggests alternative paths`,
        icon: Navigation
      });
    }
    
    if (weatherIssues.length > 0) {
      insights.push({
        type: 'alert',
        message: `Weather disruptions affecting ${weatherIssues.length} shipments - delays expected`,
        icon: CloudRain
      });
    }
    
    if (stats.on_time_rate > 80) {
      insights.push({
        type: 'success',
        message: `Excellent performance: ${stats.on_time_rate}% on-time delivery rate`,
        icon: Sparkles
      });
    }
    
    return insights;
  };

  // Get route optimization suggestions
  const getRouteOptimizations = (): Array<{
    shipmentId: string;
    current: string;
    issue: string;
    improvement: string;
    recommended: boolean;
  }> => {
    const optimizations: Array<{
      shipmentId: string;
      current: string;
      issue: string;
      improvement: string;
      recommended: boolean;
    }> = [];
    const atRiskShipments = shipments.filter(s => s.status === 'At Risk').slice(0, 3);
    
    atRiskShipments.forEach(s => {
      optimizations.push({
        shipmentId: s.id,
        current: `${s.origin} → ${s.destination}`,
        issue: s.traffic === 'heavy' ? 'Heavy Traffic' : s.weather === 'rainy' ? 'Weather Risk' : 'Route Bottleneck',
        improvement: `${Math.floor(Math.random() * 30 + 15)}% faster`,
        recommended: true
      });
    });
    
    return optimizations;
  };

  // Get disruption detections
  const getDisruptions = () => {
    const disruptions = [];
    const heavyTraffic = shipments.filter(s => s.traffic === 'heavy').length;
    const badWeather = shipments.filter(s => s.weather === 'rainy' || s.weather === 'stormy').length;
    const highwayRoutes = shipments.filter(s => s.route_type === 'highway' && s.delay_probability > 50).length;
    
    if (heavyTraffic > 0) {
      disruptions.push({
        type: 'traffic',
        severity: heavyTraffic > 5 ? 'high' : 'medium',
        message: `Traffic congestion affecting ${heavyTraffic} routes`,
        icon: Navigation,
        count: heavyTraffic
      });
    }
    
    if (badWeather > 0) {
      disruptions.push({
        type: 'weather',
        severity: badWeather > 3 ? 'high' : 'medium',
        message: `Weather conditions impacting ${badWeather} shipments`,
        icon: CloudRain,
        count: badWeather
      });
    }
    
    if (highwayRoutes > 0) {
      disruptions.push({
        type: 'route',
        severity: 'medium',
        message: `${highwayRoutes} highway routes experiencing delays`,
        icon: Route,
        count: highwayRoutes
      });
    }
    
    return disruptions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-cyan-400 font-semibold text-lg animate-pulse">Initializing ChainGuard AI...</p>
          <p className="text-slate-500 text-sm mt-2">Loading real-time logistics data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 border-2 border-red-500/50 rounded-full flex items-center justify-center">
            <XCircle size={40} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">System Connection Error</h2>
          <p className="text-slate-400 mb-6 max-w-md">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            Reconnect System
          </button>
        </div>
      </div>
    );
  }

  const insights = getAIInsights();
  const optimizations = getRouteOptimizations();
  const disruptions = getDisruptions();

  const RISK_COLORS = ['rgba(18, 212, 134, 1)', '#f59e0b', '#a012c4ff', '#dc2626']; // Green, Yellow, Red, Dark Red

  return (
    <div className="space-y-6">
      {/* Data Selector - Always Visible */}
      <DashboardDataSelector onDataLoaded={handleDataLoaded} />

      {/* Data Source Indicator & Download Report Button */}
      {dataLoaded && stats && (
        <div className="flex justify-between items-center">
          {/* Data Source Badge */}
          <div className={`px-4 py-2 rounded-lg border backdrop-blur-sm ${
            isUploadedData 
              ? 'bg-blue-500/10 border-blue-500/30' 
              : 'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isUploadedData ? 'bg-blue-400' : 'bg-green-400'
              }`} />
              <span className={`text-sm font-semibold ${
                isUploadedData ? 'text-blue-400' : 'text-green-400'
              }`}>
                {isUploadedData ? 'Uploaded Dataset' : 'Sample Data'} • {stats.total} Shipments
              </span>
            </div>
          </div>

          {/* Download Report Button */}
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
          >
            <Download size={20} />
            <span>Generate Report</span>
            <FileText size={18} />
          </button>
        </div>
      )}

      {/* Show dashboard content only if data is loaded */}
      {dataLoaded && (
        <>
          {/* Live Metrics - New Feature */}
          {stats && <LiveMetrics stats={stats} />}

      {/* Top Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Shipments"
            value={stats.total}
            icon={<Package />}
            color="blue"
            trend="+12%"
          />
          <StatCard
            title="On Time"
            value={stats.on_time}
            subtitle={`${stats.on_time_rate}% success rate`}
            icon={<CheckCircle />}
            color="green"
            trend="+5%"
          />
          <StatCard
            title="At Risk"
            value={stats.at_risk}
            subtitle="Requires monitoring"
            icon={<AlertTriangle />}
            color="yellow"
            trend="-3%"
          />
          <StatCard
            title="Delayed"
            value={stats.delayed}
            subtitle="Critical attention"
            icon={<XCircle />}
            color="red"
            trend="-8%"
          />
          <StatCard
            title="Avg Delay"
            value={`${Math.round(stats.avg_delay_minutes)}m`}
            subtitle="Expected delay time"
            icon={<Clock />}
            color="purple"
            trend="-15%"
          />
        </div>
      )}

      {/* Main Dashboard Grid - Enhanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Shipments & Map (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Shipment Monitor */}
          <ShipmentTable
            shipments={shipments}
            onSelect={setSelectedShipment}
            selected={selectedShipment}
          />

          {/* Map View */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Navigation className="text-cyan-400" size={20} />
                Live Route Tracking
              </h3>
            </div>
            <div className="h-[400px]">
              <MapView
                shipments={shipments}
                selectedShipment={selectedShipment}
                onSelectShipment={setSelectedShipment}
              />
            </div>
          </div>
        </div>

        {/* Right Column - AI Panels (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Performance Score - New Feature */}
          {stats && <PerformanceScore stats={stats} />}

          {/* AI Risk Assessment Panel */}
          {selectedShipment && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 animate-in fade-in slide-in-from-right duration-300">
              <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-blue-900/40">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Brain className="text-purple-400" size={20} />
                  AI Risk Analysis
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Circular Risk Indicator */}
                <div className="flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-800"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - selectedShipment.delay_probability / 100)}`}
                        className={`${
                          selectedShipment.delay_probability >= 65
                            ? 'text-red-500'
                            : selectedShipment.delay_probability >= 35
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        } transition-all duration-1000`}
                        style={{
                          filter: 'drop-shadow(0 0 8px currentColor)'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-black text-white">{selectedShipment.delay_probability}%</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Delay Risk</div>
                    </div>
                  </div>
                </div>

                {/* Risk Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Expected Delay</span>
                    <span className="text-white font-bold">
                      {selectedShipment.expected_delay_minutes > 0
                        ? `+${Math.round(selectedShipment.expected_delay_minutes)} min`
                        : 'On Schedule'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Risk Level</span>
                    <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                      selectedShipment.status === 'Delayed'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : selectedShipment.status === 'At Risk'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-green-500/20 text-green-400 border border-green-500/50'
                    }`}>
                      {selectedShipment.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Shipment ID</span>
                    <span className="text-cyan-400 font-mono font-bold">{selectedShipment.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed - New Feature */}
          <ActivityFeed shipments={shipments} />

          {/* Disruption Detection */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10">
            <div className="px-6 py-4 border-b border-red-500/20 bg-gradient-to-r from-red-900/40 to-orange-900/40">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertCircle className="text-red-400" size={20} />
                Disruption Detection
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {disruptions.length > 0 ? (
                disruptions.map((d, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border backdrop-blur-sm animate-in fade-in slide-in-from-left duration-300 ${
                      d.severity === 'high'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        d.severity === 'high' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                      }`}>
                        <d.icon size={18} className={d.severity === 'high' ? 'text-red-400' : 'text-yellow-400'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-semibold text-sm">{d.message}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            d.severity === 'high' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'
                          }`}>
                            {d.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs">Active alerts: {d.count}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-green-400 font-semibold">All Systems Optimal</p>
                  <p className="text-slate-500 text-sm mt-1">No disruptions detected</p>
                </div>
              )}
            </div>
          </div>

          {/* Smart Route Optimization */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Zap className="text-cyan-400" size={20} />
                Smart Route Optimization
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {optimizations.length > 0 ? (
                optimizations.map((opt, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-right duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-cyan-400 font-mono text-xs font-bold">#{opt.shipmentId}</span>
                      {opt.recommended && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg shadow-cyan-500/50">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className="text-white text-sm font-semibold mb-1">{opt.current}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-400">Issue: {opt.issue}</span>
                      <span className="text-green-400 font-bold">↓ {opt.improvement}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Route className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">All routes optimized</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
            <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-pink-900/40">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Brain className="text-purple-400" size={20} />
                AI Insights
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-300"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <insight.icon size={16} className="text-purple-400" />
                    </div>
                    <p className="text-slate-300 text-sm flex-1">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        {riskData.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20">
              <h3 className="text-white font-bold">Risk Distribution</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {riskData.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={RISK_COLORS[index % RISK_COLORS.length]}
                        stroke={RISK_COLORS[index % RISK_COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {riskData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full shadow-lg" 
                      style={{ 
                        backgroundColor: RISK_COLORS[index],
                        boxShadow: `0 0 10px ${RISK_COLORS[index]}50`
                      }} 
                    />
                    <span className="text-white font-semibold text-sm">{entry.name}</span>
                    <span className="text-slate-400 text-xs">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delay Causes */}
        {delayCauses.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20">
              <h3 className="text-white font-bold">Delay Causes</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={delayCauses}>
                  <XAxis dataKey="cause" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekly Performance */}
        {weeklyData.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20">
              <h3 className="text-white font-bold">Weekly Performance</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="on_time" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                  <Line type="monotone" dataKey="delayed" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant - Floating Chat */}
      <AIAssistant shipments={shipments} />
        </>
      )}
    </div>
  );
}
