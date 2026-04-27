import { useState } from "react";
import { Upload, Sparkles, Database, Loader2, AlertCircle, Download } from "lucide-react";

interface DashboardDataSelectorProps {
  onDataLoaded: (data?: any[]) => void;
}

export default function DashboardDataSelector({ onDataLoaded }: DashboardDataSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Required columns for shipment dataset
  const REQUIRED_COLUMNS = [
    'id', 'origin', 'destination', 'distance', 'traffic', 
    'weather', 'route_type', 'vehicle_type', 'historical_delay', 
    'cargo', 'eta_hours'
  ];

  const validateCSV = (csvText: string): { valid: boolean; data?: any[]; error?: string } => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return { valid: false, error: 'CSV file is empty or has no data rows' };
      }

      // Parse header
      const header = lines[0].split(',').map(col => col.trim().toLowerCase());
      
      // Check for required columns
      const missingColumns = REQUIRED_COLUMNS.filter(col => !header.includes(col));
      if (missingColumns.length > 0) {
        return { 
          valid: false, 
          error: `Invalid dataset format. Missing required columns: ${missingColumns.join(', ')}. Please use the correct shipment dataset template.` 
        };
      }

      // Parse data rows
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.trim());
        if (values.length !== header.length) continue;

        const row: any = {};
        header.forEach((col, index) => {
          row[col] = values[index];
        });
        data.push(row);
      }

      if (data.length === 0) {
        return { valid: false, error: 'No valid data rows found in CSV file' };
      }

      return { valid: true, data };
    } catch (err) {
      return { valid: false, error: 'Failed to parse CSV file. Please check the format.' };
    }
  };

  const handleSampleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate loading sample data
      await new Promise(resolve => setTimeout(resolve, 1500));
      onDataLoaded(); // Load from backend API
    } catch (err) {
      setError("Failed to load sample data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Read file content
      const text = await file.text();
      
      // Validate CSV
      const validation = validateCSV(text);
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid CSV format');
        setLoading(false);
        return;
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Pass validated data to parent
      onDataLoaded(validation.data);
    } catch (err) {
      setError("Failed to process uploaded file. Please ensure it's a valid CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `id,origin,destination,distance,traffic,weather,route_type,vehicle_type,historical_delay,cargo,eta_hours
SH001,New York,Boston,350,medium,clear,highway,truck,25,Electronics,4
SH002,Los Angeles,San Francisco,615,high,rain,highway,van,45,Furniture,7
SH003,Chicago,Detroit,450,low,clear,highway,truck,15,Food,5
SH004,Miami,Orlando,380,medium,cloudy,mixed,van,30,Clothing,4
SH005,Seattle,Portland,280,high,storm,highway,truck,60,Medical,3`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-2xl shadow-cyan-500/30">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to ChainGuard AI
          </h2>
          <p className="text-slate-400 text-lg">
            Get started by loading sample data or uploading your own dataset
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sample Data Option */}
          <button
            onClick={handleSampleData}
            disabled={loading}
            className="group relative p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl hover:border-green-500/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-in fade-in slide-in-from-left duration-500"
            style={{ animationDelay: '100ms' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/50 group-hover:shadow-green-500/70 transition-shadow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Use Sample Data</h3>
              <p className="text-slate-400 mb-4">
                Load pre-configured sample shipments for instant demo
              </p>
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                <span>Quick Start</span>
                <span>•</span>
                <span>5 Shipments</span>
                <span>•</span>
                <span>Instant</span>
              </div>
            </div>
          </button>

          {/* Upload Data Option */}
          <label className="group relative p-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl hover:border-blue-500/60 transition-all duration-300 hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-right duration-500"
            style={{ animationDelay: '200ms' }}
          >
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-shadow">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Upload Dataset</h3>
              <p className="text-slate-400 mb-4">
                Import your own CSV file with shipment data
              </p>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
                <span>Custom Data</span>
                <span>•</span>
                <span>CSV Format</span>
                <span>•</span>
                <span>Unlimited</span>
              </div>
            </div>
          </label>
        </div>

        {/* Download Template */}
        <div className="text-center animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: '300ms' }}>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all text-slate-300 hover:text-white"
          >
            <Download size={18} />
            <span className="font-semibold">Download CSV Template</span>
          </button>
          <p className="text-slate-500 text-sm mt-3">
            Need help? Download our template to see the required format
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 text-purple-400 mx-auto mb-3 animate-spin" />
            <p className="text-white font-bold text-lg mb-1">Loading Dashboard Data...</p>
            <p className="text-slate-400 text-sm">Please wait while we prepare your analytics</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-bold mb-1">Error Loading Data</p>
                <p className="text-slate-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
          <h4 className="text-white font-bold mb-3 flex items-center gap-2">
            <Database size={18} className="text-cyan-400" />
            What happens next?
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Your data will be analyzed by our AI engine</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Real-time risk assessments will be generated</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Interactive dashboard with live metrics will appear</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>AI-powered insights and recommendations will be provided</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
