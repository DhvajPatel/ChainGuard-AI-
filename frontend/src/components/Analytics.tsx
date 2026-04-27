import { useEffect, useState } from "react";
import { fetchWeekly, fetchRiskDist, fetchDelayCauses, fetchRoutePerf } from "../api";
import WeeklyPerformanceChart from "./WeeklyPerformanceChart";
import RiskDistributionChart from "./RiskDistributionChart";
import DelayCausesChart from "./DelayCausesChart";
import RoutePerformanceChart from "./RoutePerformanceChart";
import { BarChart3 } from "lucide-react";

interface WeeklyData {
  day: string;
  on_time: number;
  delayed: number;
  avg_delay: number;
}

interface RiskData {
  name: string;
  value: number;
  color: string;
}

interface DelayCauseData {
  cause: string;
  count: number;
  percentage: number;
}

interface RoutePerformanceData {
  route: string;
  on_time_rate: number;
  avg_delay: number;
}

interface SharedDashboardData {
  shipments: any[];
  stats: any;
  riskData: any[];
  delayCauses: any[];
  weeklyData: any[];
  dataLoaded: boolean;
  isUploadedData: boolean;
  timestamp?: string;
}

interface AnalyticsProps {
  sharedData?: SharedDashboardData | null;
}

export default function Analytics({ sharedData }: AnalyticsProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [delayCausesData, setDelayCausesData] = useState<DelayCauseData[]>([]);
  const [routePerfData, setRoutePerfData] = useState<RoutePerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If shared data exists (from uploaded dataset), use it
    if (sharedData && sharedData.dataLoaded) {
      console.log('📊 Analytics using uploaded dataset');
      setWeeklyData(sharedData.weeklyData || []);
      setRiskData(sharedData.riskData || []);
      setDelayCausesData(sharedData.delayCauses || []);
      // Generate route performance from shipments
      if (sharedData.shipments && sharedData.shipments.length > 0) {
        const routePerf = generateRoutePerformance(sharedData.shipments);
        setRoutePerfData(routePerf);
      }
      setLoading(false);
    } else {
      // Otherwise load from backend API
      loadAnalytics();
    }
  }, [sharedData?.timestamp]); // Only re-run when timestamp changes

  const generateRoutePerformance = (shipments: any[]): RoutePerformanceData[] => {
    const routeMap = new Map<string, { onTime: number; total: number; totalDelay: number }>();
    
    shipments.forEach(s => {
      const route = `${s.origin} → ${s.destination}`;
      if (!routeMap.has(route)) {
        routeMap.set(route, { onTime: 0, total: 0, totalDelay: 0 });
      }
      const data = routeMap.get(route)!;
      data.total++;
      if (s.status === 'On Time') data.onTime++;
      data.totalDelay += s.expected_delay_minutes || 0;
    });

    return Array.from(routeMap.entries())
      .map(([route, data]) => ({
        route,
        on_time_rate: Math.round((data.onTime / data.total) * 100),
        avg_delay: Math.round(data.totalDelay / data.total)
      }))
      .sort((a, b) => b.on_time_rate - a.on_time_rate)
      .slice(0, 10); // Top 10 routes
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [weekly, risk, delayCauses, routePerf] = await Promise.all([
        fetchWeekly(),
        fetchRiskDist(),
        fetchDelayCauses(),
        fetchRoutePerf()
      ]);
      setWeeklyData(weekly);
      setRiskData(risk);
      setDelayCausesData(delayCauses);
      setRoutePerfData(routePerf);
    } catch (err) {
      setError("Failed to load analytics data. Please ensure the backend is running.");
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Error Loading Analytics</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      {sharedData && sharedData.dataLoaded && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <div>
              <p className="text-blue-400 font-semibold">
                Using {sharedData.isUploadedData ? 'Uploaded Dataset' : 'Sample Data'}
              </p>
              <p className="text-slate-400 text-sm">
                Analytics updated with {sharedData.shipments?.length || 0} shipments from Dashboard
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Performance Analytics</h2>
        <p className="text-slate-400">Track weekly trends and performance metrics</p>
      </div>

      {/* Weekly Performance Chart */}
      <WeeklyPerformanceChart data={weeklyData} />

      {/* Risk Distribution and Delay Causes Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart data={riskData} />
        <DelayCausesChart data={delayCausesData} />
      </div>

      {/* Route Performance Chart */}
      <RoutePerformanceChart data={routePerfData} />
    </div>
  );
}
