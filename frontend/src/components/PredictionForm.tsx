import { useState, type FormEvent } from "react";
import { predictDelay, type PredictRequest, type PredictResponse } from "../api";
import { TrendingUp, Loader2, Brain, Sparkles } from "lucide-react";

interface PredictionFormProps {
  onPredictionResult: (result: PredictResponse) => void;
}

export default function PredictionForm({ onPredictionResult }: PredictionFormProps) {
  const [formData, setFormData] = useState<PredictRequest>({
    distance: 500,
    traffic: "medium",
    weather: "clear",
    route_type: "highway",
    vehicle_type: "truck",
    historical_delay: 30,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.distance || formData.distance <= 0) {
      errors.distance = "Distance must be greater than 0";
    }

    if (!formData.traffic) {
      errors.traffic = "Traffic level is required";
    }

    if (!formData.weather) {
      errors.weather = "Weather condition is required";
    }

    if (!formData.route_type) {
      errors.route_type = "Route type is required";
    }

    if (!formData.vehicle_type) {
      errors.vehicle_type = "Vehicle type is required";
    }

    if (formData.historical_delay < 0) {
      errors.historical_delay = "Historical delay cannot be negative";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await predictDelay(formData);
      onPredictionResult(result);
    } catch (err) {
      setError("Failed to get prediction. Please ensure the backend is running.");
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PredictRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
      <div className="px-8 py-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            <Brain className="text-cyan-400" size={28} />
          </div>
          <div>
            <h2 className="text-white font-bold text-2xl flex items-center gap-2">
              AI Delay Prediction
              <Sparkles size={20} className="text-cyan-400" />
            </h2>
            <p className="text-cyan-400/80 text-sm font-medium">Enter shipment parameters for intelligent analysis</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distance Input */}
          <div>
            <label htmlFor="distance" className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">
              Distance (km) <span className="text-red-400">*</span>
            </label>
            <input
              id="distance"
              type="number"
              min="0"
              step="0.1"
              value={formData.distance}
              onChange={(e) => handleInputChange("distance", parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 bg-slate-800/50 border ${
                validationErrors.distance ? "border-red-500/50" : "border-cyan-500/30"
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur-sm font-semibold`}
              placeholder="Enter distance"
            />
            {validationErrors.distance && (
              <p className="text-red-400 text-sm mt-2 font-semibold">{validationErrors.distance}</p>
            )}
          </div>

          {/* Historical Delay Input */}
          <div>
            <label htmlFor="historical_delay" className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">
              Historical Delay (min)
            </label>
            <input
              id="historical_delay"
              type="number"
              min="0"
              step="1"
              value={formData.historical_delay}
              onChange={(e) => handleInputChange("historical_delay", parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 bg-slate-800/50 border ${
                validationErrors.historical_delay ? "border-red-500/50" : "border-cyan-500/30"
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur-sm font-semibold`}
              placeholder="Average past delay"
            />
            {validationErrors.historical_delay && (
              <p className="text-red-400 text-sm mt-2 font-semibold">{validationErrors.historical_delay}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traffic Level Select */}
          <div>
            <label htmlFor="traffic" className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">
              Traffic Level <span className="text-red-400">*</span>
            </label>
            <select
              id="traffic"
              value={formData.traffic}
              onChange={(e) => handleInputChange("traffic", e.target.value)}
              className={`w-full px-4 py-3 bg-slate-800/50 border ${
                validationErrors.traffic ? "border-red-500/50" : "border-cyan-500/30"
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur-sm font-semibold`}
            >
              <option value="low">🟢 Low - Light traffic</option>
              <option value="medium">🟡 Medium - Moderate congestion</option>
              <option value="high">🔴 High - Heavy congestion</option>
            </select>
            {validationErrors.traffic && (
              <p className="text-red-400 text-sm mt-2 font-semibold">{validationErrors.traffic}</p>
            )}
          </div>

          {/* Weather Condition Select */}
          <div>
            <label htmlFor="weather" className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">
              Weather Condition <span className="text-red-400">*</span>
            </label>
            <select
              id="weather"
              value={formData.weather}
              onChange={(e) => handleInputChange("weather", e.target.value)}
              className={`w-full px-4 py-3 bg-slate-800/50 border ${
                validationErrors.weather ? "border-red-500/50" : "border-cyan-500/30"
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur-sm font-semibold`}
            >
              <option value="clear">☀️ Clear - Good visibility</option>
              <option value="cloudy">☁️ Cloudy - Overcast skies</option>
              <option value="rain">🌧️ Rain - Wet conditions</option>
              <option value="storm">⛈️ Storm - Severe weather</option>
            </select>
            {validationErrors.weather && (
              <p className="text-red-400 text-sm mt-2 font-semibold">{validationErrors.weather}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Route Type Select */}
          <div>
            <label htmlFor="route_type" className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">
              Route Type <span className="text-red-400">*</span>
            </label>
            <select
              id="route_type"
              value={formData.route_type}
              onChange={(e) => handleInputChange("route_type", e.target.value)}
              className={`w-full px-4 py-3 bg-slate-800/50 border ${
                validationErrors.route_type ? "border-red-500/50" : "border-cyan-500/30"
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur-sm font-semibold`}
            >
              <option value="highway">🛣️ Highway - Fast expressway</option>
              <option value="urban">🏙️ Urban - City streets</option>
              <option value="mixed">🔀 Mixed - Combined route</option>
            </select>
            {validationErrors.route_type && (
              <p className="text-red-400 text-sm mt-2 font-semibold">{validationErrors.route_type}</p>
            )}
          </div>

          {/* Vehicle Type Select */}
          <div>
            <label htmlFor="vehicle_type" className="block text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">
              Vehicle Type <span className="text-red-400">*</span>
            </label>
            <select
              id="vehicle_type"
              value={formData.vehicle_type}
              onChange={(e) => handleInputChange("vehicle_type", e.target.value)}
              className={`w-full px-4 py-3 bg-slate-800/50 border ${
                validationErrors.vehicle_type ? "border-red-500/50" : "border-cyan-500/30"
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur-sm font-semibold`}
            >
              <option value="truck">🚛 Truck - Heavy cargo vehicle</option>
              <option value="van">🚐 Van - Medium cargo vehicle</option>
              <option value="bike">🏍️ Bike - Light delivery vehicle</option>
            </select>
            {validationErrors.vehicle_type && (
              <p className="text-red-400 text-sm mt-2 font-semibold">{validationErrors.vehicle_type}</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/30 disabled:shadow-none hover:scale-[1.02] disabled:scale-100 text-lg uppercase tracking-wider"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>AI Processing...</span>
            </>
          ) : (
            <>
              <TrendingUp size={24} />
              <span>Generate AI Prediction</span>
              <Sparkles size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
