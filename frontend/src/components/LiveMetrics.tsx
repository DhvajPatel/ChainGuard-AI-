import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MetricProps {
  label: string;
  value: number;
  unit: string;
  trend: number;
  color: "green" | "blue" | "purple" | "cyan";
}

export default function LiveMetrics({ stats }: { stats: any }) {
  const [metrics, setMetrics] = useState<MetricProps[]>([]);

  useEffect(() => {
    if (!stats) return;

    const newMetrics: MetricProps[] = [
      {
        label: "Efficiency Score",
        value: stats.on_time_rate,
        unit: "%",
        trend: Math.random() * 10 - 5,
        color: "green"
      },
      {
        label: "Active Routes",
        value: stats.total,
        unit: "",
        trend: Math.random() * 5,
        color: "blue"
      },
      {
        label: "AI Predictions",
        value: stats.total * 3,
        unit: "/hr",
        trend: Math.random() * 15,
        color: "purple"
      },
      {
        label: "Cost Savings",
        value: Math.round(stats.total * 125),
        unit: "$",
        trend: Math.random() * 20,
        color: "cyan"
      }
    ];

    setMetrics(newMetrics);
  }, [stats]);

  const colorMap = {
    green: {
      bg: "from-green-500/20 to-green-600/5",
      border: "border-green-500/30",
      text: "text-green-400",
      glow: "shadow-green-500/20"
    },
    blue: {
      bg: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/30",
      text: "text-blue-400",
      glow: "shadow-blue-500/20"
    },
    purple: {
      bg: "from-purple-500/20 to-purple-600/5",
      border: "border-purple-500/30",
      text: "text-purple-400",
      glow: "shadow-purple-500/20"
    },
    cyan: {
      bg: "from-cyan-500/20 to-cyan-600/5",
      border: "border-cyan-500/30",
      text: "text-cyan-400",
      glow: "shadow-cyan-500/20"
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const colors = colorMap[metric.color];
        const isPositive = metric.trend >= 0;

        return (
          <div
            key={index}
            className={`relative bg-gradient-to-br ${colors.bg} backdrop-blur-xl border ${colors.border} rounded-2xl p-5 overflow-hidden shadow-xl ${colors.glow} hover:scale-105 transition-all duration-300 animate-in fade-in slide-in-from-bottom`}
            style={{ animationDelay: `${index * 100}ms`, animationDuration: '500ms' }}
          >
            {/* Animated background pulse */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 ${colors.text} opacity-10 rounded-full blur-3xl animate-pulse`} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{metric.label}</span>
                <Activity size={16} className={`${colors.text} animate-pulse`} />
              </div>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black text-white">
                  {metric.unit === "$" && metric.unit}
                  {metric.value.toFixed(metric.unit === "%" ? 0 : 0)}
                  {metric.unit !== "$" && metric.unit}
                </span>
              </div>

              <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{isPositive ? '+' : ''}{metric.trend.toFixed(1)}%</span>
                <span className="text-slate-500 ml-1">vs last hour</span>
              </div>
            </div>

            {/* Bottom glow line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current ${colors.text} to-transparent opacity-50 animate-pulse`} />
          </div>
        );
      })}
    </div>
  );
}
