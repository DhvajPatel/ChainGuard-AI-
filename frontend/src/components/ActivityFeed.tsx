import { useEffect, useState } from "react";
import { Activity, CheckCircle, AlertTriangle, TrendingUp, Navigation, Zap } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "success" | "warning" | "info" | "optimization";
  message: string;
  timestamp: Date;
  icon: any;
}

export default function ActivityFeed({ shipments }: { shipments: any[] }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (shipments.length === 0) return;

    // Generate initial activities
    const initialActivities: ActivityItem[] = [
      {
        id: "1",
        type: "success",
        message: `Shipment #${shipments[0]?.id} delivered on time`,
        timestamp: new Date(Date.now() - 2 * 60000),
        icon: CheckCircle
      },
      {
        id: "2",
        type: "optimization",
        message: "AI optimized 3 routes, saving 45 minutes",
        timestamp: new Date(Date.now() - 5 * 60000),
        icon: Zap
      },
      {
        id: "3",
        type: "warning",
        message: `High traffic detected on Route A`,
        timestamp: new Date(Date.now() - 8 * 60000),
        icon: AlertTriangle
      },
      {
        id: "4",
        type: "info",
        message: "Real-time monitoring active for 12 shipments",
        timestamp: new Date(Date.now() - 12 * 60000),
        icon: Activity
      }
    ];

    setActivities(initialActivities);

    // Simulate real-time updates - increased to 30 seconds for better performance
    const interval = setInterval(() => {
      const messages = [
        { type: "success", message: `Shipment #${Math.floor(Math.random() * 1000)} delivered successfully`, icon: CheckCircle },
        { type: "optimization", message: `AI suggested route change saved ${Math.floor(Math.random() * 30 + 10)} minutes`, icon: Zap },
        { type: "warning", message: "Weather alert: Rain expected on Route B", icon: AlertTriangle },
        { type: "info", message: `${Math.floor(Math.random() * 5 + 1)} new shipments added to queue`, icon: Navigation },
        { type: "success", message: "Performance score improved by 2%", icon: TrendingUp }
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: randomMessage.type as any,
        message: randomMessage.message,
        timestamp: new Date(),
        icon: randomMessage.icon
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 10));
    }, 30000); // Reduced frequency: New activity every 30 seconds (was 15s)

    return () => clearInterval(interval);
  }, [shipments]);

  const getActivityColor = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          text: "text-green-400",
          icon: "text-green-400"
        };
      case "warning":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          text: "text-yellow-400",
          icon: "text-yellow-400"
        };
      case "optimization":
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
          text: "text-purple-400",
          icon: "text-purple-400"
        };
      default:
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-400",
          icon: "text-blue-400"
        };
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
      <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Activity size={20} className="text-cyan-400 animate-pulse" />
            Live Activity Feed
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-cyan-400 text-xs font-bold">LIVE</span>
          </div>
        </div>
      </div>
      <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
        {activities.map((activity, index) => {
          const colors = getActivityColor(activity.type);
          const Icon = activity.icon;

          return (
            <div
              key={activity.id}
              className={`p-4 ${colors.bg} border ${colors.border} rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-left duration-300`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 ${colors.bg} border ${colors.border} rounded-lg`}>
                  <Icon size={16} className={colors.icon} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{activity.message}</p>
                  <p className="text-slate-500 text-xs mt-1">{getTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
