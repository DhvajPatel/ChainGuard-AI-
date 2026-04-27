import { useState } from "react";
import { Upload, FileSpreadsheet, Download, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { predictDelay, type PredictRequest } from "../api";

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  predictions: any[];
}

export default function DataUploader({ onResults }: { onResults: (results: any[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleData = [
    { distance: 450, traffic: "medium", weather: "clear", route_type: "highway", vehicle_type: "truck", historical_delay: 25 },
    { distance: 320, traffic: "high", weather: "rain", route_type: "urban", vehicle_type: "van", historical_delay: 45 },
    { distance: 680, traffic: "low", weather: "clear", route_type: "highway", vehicle_type: "truck", historical_delay: 15 },
    { distance: 150, traffic: "medium", weather: "cloudy", route_type: "mixed", vehicle_type: "bike", historical_delay: 10 },
    { distance: 890, traffic: "high", weather: "storm", route_type: "highway", vehicle_type: "truck", historical_delay: 60 }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV (assuming header row)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data: PredictRequest[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Map to PredictRequest format
        data.push({
          distance: parseFloat(row.distance) || 0,
          traffic: row.traffic || "medium",
          weather: row.weather || "clear",
          route_type: row.route_type || row.route || "highway",
          vehicle_type: row.vehicle_type || row.vehicle || "truck",
          historical_delay: parseFloat(row.historical_delay) || 0
        });
      }

      // Process predictions
      await processBatch(data);
    } catch (err) {
      setError("Failed to parse file. Please ensure it's a valid CSV format.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const processBatch = async (data: PredictRequest[]) => {
    const predictions = [];
    let successful = 0;
    let failed = 0;

    for (const item of data) {
      try {
        const prediction = await predictDelay(item);
        predictions.push({ ...item, ...prediction });
        successful++;
      } catch (err) {
        failed++;
        console.error("Prediction failed:", err);
      }
    }

    const uploadResult = {
      total: data.length,
      successful,
      failed,
      predictions
    };

    setResult(uploadResult);
    onResults(predictions);
  };

  const handleSampleData = async () => {
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      await processBatch(sampleData);
    } catch (err) {
      setError("Failed to process sample data.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `distance,traffic,weather,route_type,vehicle_type,historical_delay
500,medium,clear,highway,truck,30
350,high,rain,urban,van,45
700,low,clear,highway,truck,20
200,medium,cloudy,mixed,bike,15
900,high,storm,highway,truck,55`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shipment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
      <div className="px-8 py-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-pink-900/40">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 shadow-lg shadow-purple-500/20">
            <Upload className="text-purple-400" size={28} />
          </div>
          <div>
            <h2 className="text-white font-bold text-2xl flex items-center gap-2">
              Batch Prediction Upload
              <Sparkles size={20} className="text-purple-400" />
            </h2>
            <p className="text-purple-400/80 text-sm font-medium">Upload CSV or use sample data for instant predictions</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Upload Button */}
          <label className="relative cursor-pointer group">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl hover:border-cyan-500/50 transition-all hover:scale-105 text-center">
              <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <p className="text-white font-bold mb-1">Upload CSV</p>
              <p className="text-slate-400 text-xs">Drag or click to upload</p>
            </div>
          </label>

          {/* Sample Data Button */}
          <button
            onClick={handleSampleData}
            disabled={uploading}
            className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl hover:border-green-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-white font-bold mb-1">Use Sample Data</p>
            <p className="text-slate-400 text-xs">5 pre-loaded shipments</p>
          </button>

          {/* Download Template Button */}
          <button
            onClick={downloadTemplate}
            className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl hover:border-yellow-500/50 transition-all hover:scale-105"
          >
            <Download className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-white font-bold mb-1">Download Template</p>
            <p className="text-slate-400 text-xs">CSV format example</p>
          </button>
        </div>

        {/* Loading State */}
        {uploading && (
          <div className="p-8 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
            <p className="text-white font-bold text-lg mb-2">Processing Predictions...</p>
            <p className="text-slate-400 text-sm">AI is analyzing your shipment data</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-bold mb-1">Upload Failed</p>
                <p className="text-slate-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-400 font-bold text-lg mb-1">Batch Processing Complete!</p>
                  <p className="text-slate-300 text-sm">All predictions have been generated successfully</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
                  <p className="text-3xl font-black text-white mb-1">{result.total}</p>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Total</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-green-500/30 text-center">
                  <p className="text-3xl font-black text-green-400 mb-1">{result.successful}</p>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Success</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-red-500/30 text-center">
                  <p className="text-3xl font-black text-red-400 mb-1">{result.failed}</p>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Failed</p>
                </div>
              </div>
            </div>

            {/* Results Preview */}
            <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-cyan-400" />
                  Prediction Results
                </h3>
                <span className="text-slate-400 text-sm">{result.predictions.length} shipments</span>
              </div>
              <p className="text-slate-400 text-sm">
                Scroll down to view detailed predictions for each shipment including risk levels, 
                expected delays, and AI-recommended solutions.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-cyan-400" />
            CSV Format Requirements
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Your CSV file should include these columns:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
              <li><span className="text-cyan-400 font-mono">distance</span> - Distance in kilometers (number)</li>
              <li><span className="text-cyan-400 font-mono">traffic</span> - Traffic level: low, medium, high</li>
              <li><span className="text-cyan-400 font-mono">weather</span> - Weather: clear, cloudy, rain, storm</li>
              <li><span className="text-cyan-400 font-mono">route_type</span> - Route: highway, urban, mixed</li>
              <li><span className="text-cyan-400 font-mono">vehicle_type</span> - Vehicle: truck, van, bike</li>
              <li><span className="text-cyan-400 font-mono">historical_delay</span> - Past delay in minutes (number)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
