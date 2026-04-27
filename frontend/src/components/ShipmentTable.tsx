import type { Shipment } from "../api";
import StatusBadge from "./StatusBadge";
import { MapPin, Truck, Clock, Activity } from "lucide-react";

interface Props {
  shipments: Shipment[];
  onSelect: (s: Shipment) => void;
  selected: Shipment | null;
}

export default function ShipmentTable({ shipments, onSelect, selected }: Props) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
      <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Truck size={20} className="text-cyan-400" />
            Live Shipment Monitor
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <Activity size={14} className="text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-sm font-semibold">{shipments.length} Active</span>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cyan-400/80 text-xs uppercase tracking-wider border-b border-cyan-500/20 bg-slate-900/60">
              <th className="px-6 py-4 text-left font-bold">ID</th>
              <th className="px-6 py-4 text-left font-bold">Route</th>
              <th className="px-6 py-4 text-left font-bold">Cargo</th>
              <th className="px-6 py-4 text-left font-bold">Distance</th>
              <th className="px-6 py-4 text-left font-bold">Risk Level</th>
              <th className="px-6 py-4 text-left font-bold">ETA Impact</th>
              <th className="px-6 py-4 text-left font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s, index) => (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                className={`border-b border-slate-800/50 cursor-pointer transition-all duration-300 hover:bg-cyan-500/5 hover:border-cyan-500/30 group animate-in fade-in slide-in-from-bottom ${
                  selected?.id === s.id 
                    ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-l-4 border-l-cyan-400 shadow-lg shadow-cyan-500/20" 
                    : ""
                }`}
                style={{ animationDelay: `${index * 50}ms`, animationDuration: '500ms' }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-cyan-300 font-bold group-hover:text-cyan-200 transition-colors">
                      {s.id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-white">
                    <MapPin size={14} className="text-slate-500 shrink-0" />
                    <span className="font-medium">{s.origin}</span>
                    <span className="text-cyan-500 font-bold">→</span>
                    <span className="font-medium">{s.destination}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-300 font-medium">{s.cargo}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-300 font-semibold">{s.distance} km</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
                      <div
                        className={`absolute inset-0 h-2 rounded-full transition-all duration-1000 ${
                          s.delay_probability >= 65
                            ? "bg-gradient-to-r from-red-600 to-red-400 shadow-lg shadow-red-500/50"
                            : s.delay_probability >= 35
                            ? "bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-lg shadow-yellow-500/50"
                            : "bg-gradient-to-r from-green-600 to-green-400 shadow-lg shadow-green-500/50"
                        }`}
                        style={{ width: `${s.delay_probability}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold min-w-[3rem] ${
                      s.delay_probability >= 65
                        ? "text-red-400"
                        : s.delay_probability >= 35
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}>
                      {s.delay_probability}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    <span className={`font-semibold ${
                      s.expected_delay_minutes > 0 ? "text-red-400" : "text-green-400"
                    }`}>
                      {s.expected_delay_minutes > 0
                        ? `+${Math.round(s.expected_delay_minutes)}m`
                        : "On Track"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={s.status} color={s.status_color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Animated bottom glow */}
      <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-pulse" />
    </div>
  );
}
