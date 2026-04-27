import { useState } from "react";
import { TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Download } from "lucide-react";

interface BatchResultsProps {
  predictions: any[];
}

export default function BatchResults({ predictions }: BatchResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (predictions.length === 0) return null;

  const getRiskColor = (probability: number) => {
    if (probability >= 65) return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" };
    if (probability >= 35) return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" };
    return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" };
  };

  const downloadResults = () => {
    const csv = [
      'Distance,Traffic,Weather,Route,Vehicle,Historical Delay,Delay Probability,Expected Delay,Risk Level',
      ...predictions.map(p => 
        `${p.distance},${p.traffic},${p.weather},${p.route_type},${p.vehicle_type},${p.historical_delay},${p.delay_probability},${p.expected_delay_minutes},${p.risk_level}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary stats
  const highRisk = predictions.filter(p => p.delay_probability >= 65).length;
  const mediumRisk = predictions.filter(p => p.delay_probability >= 35 && p.delay_probability < 65).length;
  const lowRisk = predictions.filter(p => p.delay_probability < 35).length;
  const avgDelay = predictions.reduce((sum, p) => sum + p.expected_delay_minutes, 0) / predictions.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Total Shipments</p>
          <p className="text-4xl font-black text-white">{predictions.length}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">High Risk</p>
          <p className="text-4xl font-black text-white">{highRisk}</p>
          <p className="text-slate-400 text-xs mt-1">{((highRisk/predictions.length)*100).toFixed(0)}% of total</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Medium Risk</p>
          <p className="text-4xl font-black text-white">{mediumRisk}</p>
          <p className="text-slate-400 text-xs mt-1">{((mediumRisk/predictions.length)*100).toFixed(0)}% of total</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
          <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Low Risk</p>
          <p className="text-4xl font-black text-white">{lowRisk}</p>
          <p className="text-slate-400 text-xs mt-1">{((lowRisk/predictions.length)*100).toFixed(0)}% of total</p>
        </div>
      </div>

      {/* Average Delay Card */}
      <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2">Average Expected Delay</p>
            <p className="text-5xl font-black text-white">{Math.round(avgDelay)} <span className="text-2xl text-slate-400">minutes</span></p>
          </div>
          <button
            onClick={downloadResults}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2"
          >
            <Download size={20} />
            Export Results
          </button>
        </div>
      </div>

      {/* Predictions List */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-cyan-400" />
            Detailed Predictions
          </h3>
        </div>
        <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
          {predictions.map((prediction, index) => {
            const colors = getRiskColor(prediction.delay_probability);
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={index}
                className={`${colors.bg} border ${colors.border} rounded-xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-left`}
                style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Shipment</p>
                        <p className="text-white font-bold text-lg">#{index + 1}</p>
                      </div>
                      <div className="h-12 w-px bg-slate-700" />
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Route</p>
                        <p className="text-white font-semibold">{prediction.distance}km • {prediction.route_type}</p>
                      </div>
                      <div className="h-12 w-px bg-slate-700" />
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Risk Level</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-24 h-2 bg-slate-800 rounded-full overflow-hidden`}>
                            <div
                              className={`h-full ${colors.text.replace('text-', 'bg-')} transition-all duration-1000`}
                              style={{ width: `${prediction.delay_probability}%` }}
                            />
                          </div>
                          <span className={`${colors.text} font-bold text-sm`}>{prediction.delay_probability}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-slate-400 text-xs mb-1">Expected Delay</p>
                        <p className={`${colors.text} font-bold text-lg`}>
                          {prediction.expected_delay_minutes > 0 
                            ? `+${Math.round(prediction.expected_delay_minutes)}m`
                            : 'On Time'}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-slate-400" size={20} />
                      ) : (
                        <ChevronDown className="text-slate-400" size={20} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top duration-300">
                    <div className="h-px bg-slate-700" />
                    
                    {/* Shipment Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Traffic</p>
                        <p className="text-white font-semibold capitalize">{prediction.traffic}</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Weather</p>
                        <p className="text-white font-semibold capitalize">{prediction.weather}</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Vehicle</p>
                        <p className="text-white font-semibold capitalize">{prediction.vehicle_type}</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Historical Delay</p>
                        <p className="text-white font-semibold">{prediction.historical_delay}m</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Risk Level</p>
                        <p className={`${colors.text} font-bold`}>{prediction.risk_level}</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Distance</p>
                        <p className="text-white font-semibold">{prediction.distance} km</p>
                      </div>
                    </div>

                    {/* Disruption Factors */}
                    {prediction.disruption_factors && prediction.disruption_factors.length > 0 && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Disruption Factors
                        </p>
                        <ul className="space-y-1">
                          {prediction.disruption_factors.map((factor: string, i: number) => (
                            <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                              <span className="text-yellow-400 mt-1">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Route */}
                    {prediction.recommended_route && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 font-bold text-sm mb-2 flex items-center gap-2">
                          <CheckCircle size={16} />
                          AI Recommendation
                        </p>
                        <p className="text-slate-300 text-sm">
                          Switch to <span className="text-green-400 font-bold">{prediction.recommended_route}</span> for optimal delivery
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
