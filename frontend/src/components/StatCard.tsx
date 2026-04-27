import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: "green" | "yellow" | "red" | "blue" | "purple";
  trend?: string;
}

const colorMap = {
  green: {
    gradient: "from-green-500/20 via-green-600/10 to-transparent",
    border: "border-green-500/30",
    text: "text-green-400",
    glow: "shadow-green-500/20",
    iconBg: "bg-green-500/20"
  },
  yellow: {
    gradient: "from-yellow-500/20 via-yellow-600/10 to-transparent",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
    iconBg: "bg-yellow-500/20"
  },
  red: {
    gradient: "from-red-500/20 via-red-600/10 to-transparent",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
    iconBg: "bg-red-500/20"
  },
  blue: {
    gradient: "from-blue-500/20 via-blue-600/10 to-transparent",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
    iconBg: "bg-blue-500/20"
  },
  purple: {
    gradient: "from-purple-500/20 via-purple-600/10 to-transparent",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
    iconBg: "bg-purple-500/20"
  }
};

export default function StatCard({ title, value, subtitle, icon, color, trend }: Props) {
  const colors = colorMap[color];
  const isTrendPositive = trend?.startsWith('+');
  const isTrendNegative = trend?.startsWith('-');

  return (
    <div className={`relative bg-gradient-to-br ${colors.gradient} backdrop-blur-xl border ${colors.border} rounded-2xl p-6 overflow-hidden shadow-2xl ${colors.glow} hover:shadow-xl transition-all duration-300 hover:scale-105 group`}>
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Glow orb */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${colors.text} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-300`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">{title}</p>
          <div className="flex items-baseline gap-3 mb-1">
            <p className="text-white text-3xl font-black tracking-tight">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                isTrendPositive 
                  ? 'bg-green-500/20 text-green-400' 
                  : isTrendNegative 
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}>
                {isTrendPositive && <TrendingUp size={12} />}
                {isTrendNegative && <TrendingDown size={12} />}
                <span>{trend}</span>
              </div>
            )}
          </div>
          {subtitle && <p className="text-slate-500 text-xs font-medium">{subtitle}</p>}
        </div>
        
        <div className={`${colors.iconBg} ${colors.text} p-3 rounded-xl border ${colors.border} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <div className="w-6 h-6">
            {icon}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current ${colors.text} to-transparent opacity-50`} />
    </div>
  );
}
