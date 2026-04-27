import { useState } from "react";
import { Upload, Sparkles, Database, Loader2, AlertCircle, Download } from "lucide-react";

interface DashboardDataSelectorProps {
  onDataLoaded: (data?: any[]) => void;
}

export default function DashboardDataSelector({ onDataLoaded }: DashboardDataSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core columns that identify a shipment (at least some of these should exist)
  const CORE_COLUMNS = ['id', 'origin', 'destination'];
  
  // Optional columns with defaults
  const OPTIONAL_COLUMNS = [
    'distance', 'traffic', 'weather', 'route_type', 'vehicle_type', 
    'historical_delay', 'cargo', 'eta_hours'
  ];

  // All possible shipment-related column variations (expanded for ports)
  const COLUMN_ALIASES: { [key: string]: string[] } = {
    'id': ['id', 'shipment_id', 'shipmentid', 'tracking_id', 'trackingid', 'number', 'no', 'ref', 'reference', 'order', 'order_id', 'booking', 'container', 'bl', 'bill_of_lading'],
    'origin': ['origin', 'from', 'source', 'start', 'pickup', 'departure', 'origin_port', 'port_of_loading', 'pol', 'loading_port', 'departure_port', 'origin_city', 'from_port', 'shipper', 'sender'],
    'destination': ['destination', 'to', 'dest', 'end', 'delivery', 'arrival', 'destination_port', 'port_of_discharge', 'pod', 'discharge_port', 'arrival_port', 'destination_city', 'to_port', 'consignee', 'receiver'],
    'distance': ['distance', 'dist', 'km', 'miles', 'length', 'nautical_miles', 'nm'],
    'traffic': ['traffic', 'congestion', 'road_condition', 'port_congestion', 'vessel_traffic'],
    'weather': ['weather', 'climate', 'condition', 'sea_condition', 'wave_height'],
    'route_type': ['route_type', 'routetype', 'route', 'path_type', 'road_type', 'shipping_route', 'lane', 'service'],
    'vehicle_type': ['vehicle_type', 'vehicletype', 'vehicle', 'transport_type', 'truck_type', 'vessel_type', 'ship_type', 'container_type', 'mode'],
    'historical_delay': ['historical_delay', 'historicaldelay', 'delay', 'past_delay', 'avg_delay', 'average_delay', 'typical_delay'],
    'cargo': ['cargo', 'goods', 'product', 'item', 'freight', 'shipment_type', 'commodity', 'merchandise', 'load'],
    'eta_hours': ['eta_hours', 'etahours', 'eta', 'estimated_time', 'duration', 'time', 'transit_time', 'sailing_time', 'voyage_duration']
  };

  // Detect if this looks like ANY kind of logistics/shipment data
  const isShipmentRelated = (columns: string[]): boolean => {
    const shipmentKeywords = [
      'shipment', 'delivery', 'cargo', 'freight', 'transport', 'logistics',
      'port', 'vessel', 'container', 'tracking', 'order', 'booking',
      'origin', 'destination', 'from', 'to', 'route', 'eta', 'arrival',
      'departure', 'pickup', 'drop', 'sender', 'receiver', 'consignee'
    ];
    
    const normalizedColumns = columns.map(c => c.toLowerCase());
    return shipmentKeywords.some(keyword => 
      normalizedColumns.some(col => col.includes(keyword))
    );
  };

  // Parse CSV line handling quotes and commas inside quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // Normalize column name for flexible matching
  const normalizeColumnName = (name: string): string => {
    return name.toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .replace(/[^\w]/g, '');
  };

  // Find which standard column this maps to
  const findStandardColumn = (normalizedName: string): string | null => {
    for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
      const normalizedAliases = aliases.map(a => normalizeColumnName(a));
      if (normalizedAliases.includes(normalizedName)) {
        return standard;
      }
    }
    return null;
  };

  const validateCSV = (csvText: string): { valid: boolean; data?: any[]; error?: string; warnings?: string[] } => {
    try {
      const lines = csvText.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { valid: false, error: 'File is empty or has no data rows' };
      }

      // Parse header
      const rawHeader = parseCSVLine(lines[0]);
      const normalizedHeader = rawHeader.map(col => normalizeColumnName(col));
      
      // Check if this looks like shipment data at all
      if (!isShipmentRelated(rawHeader)) {
        // Very lenient - if it has at least 3 columns, try to use it anyway
        if (rawHeader.length < 3) {
          return { 
            valid: false, 
            error: 'File must have at least 3 columns. Please upload a shipment-related dataset.' 
          };
        }
        console.warn('File may not be shipment-related, but proceeding anyway...');
      }
      
      // Map columns to standard names
      const columnMapping: { [key: number]: string } = {};
      const foundColumns: string[] = [];
      
      normalizedHeader.forEach((normalized, index) => {
        const standard = findStandardColumn(normalized);
        if (standard) {
          columnMapping[index] = standard;
          foundColumns.push(standard);
        }
      });

      // Very flexible - accept if we have ANY recognizable column OR at least 3 columns
      const hasAnyShipmentColumn = foundColumns.length > 0;
      const hasMinimumColumns = rawHeader.length >= 3;
      
      if (!hasAnyShipmentColumn && !hasMinimumColumns) {
        return { 
          valid: false, 
          error: 'Could not identify shipment data. Please ensure your file has columns like: ID, Origin, Destination, or other shipment-related fields.' 
        };
      }

      // Parse data rows with flexible handling
      const data = [];
      const warnings: string[] = [];
      let skippedRows = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        
        // Skip rows with too few values
        if (values.length < 2) {
          skippedRows++;
          continue;
        }

        const row: any = {
          // Set defaults for all columns
          id: `SH${String(i).padStart(3, '0')}`,
          origin: 'Unknown',
          destination: 'Unknown',
          distance: 0,
          traffic: 'medium',
          weather: 'clear',
          route_type: 'highway',
          vehicle_type: 'truck',
          historical_delay: 0,
          cargo: 'General',
          eta_hours: 0
        };

        // Fill in values from CSV where available
        Object.entries(columnMapping).forEach(([indexStr, standardCol]) => {
          const index = parseInt(indexStr);
          if (index < values.length && values[index]) {
            const value = values[index].replace(/^["']|["']$/g, '').trim();
            if (value) {
              row[standardCol] = value;
            }
          }
        });

        // If no columns were mapped, use first 3 columns as id, origin, destination
        if (Object.keys(columnMapping).length === 0 && values.length >= 3) {
          row.id = values[0].replace(/^["']|["']$/g, '').trim() || row.id;
          row.origin = values[1].replace(/^["']|["']$/g, '').trim() || row.origin;
          row.destination = values[2].replace(/^["']|["']$/g, '').trim() || row.destination;
        }

        // Accept any row with at least some data
        if (values.some(v => v && v.trim())) {
          data.push(row);
        } else {
          skippedRows++;
        }
      }

      if (data.length === 0) {
        return { valid: false, error: 'No valid data rows found in file' };
      }

      if (skippedRows > 0) {
        warnings.push(`Processed ${data.length} rows (skipped ${skippedRows} incomplete rows)`);
      }

      if (foundColumns.length === 0) {
        warnings.push(`No standard columns detected. Using first 3 columns as: ID, Origin, Destination`);
      } else {
        const missingColumns = [...CORE_COLUMNS, ...OPTIONAL_COLUMNS].filter(col => !foundColumns.includes(col));
        if (missingColumns.length > 0) {
          warnings.push(`Using defaults for: ${missingColumns.slice(0, 3).join(', ')}${missingColumns.length > 3 ? '...' : ''}`);
        }
      }

      return { valid: true, data, warnings };
    } catch (err) {
      console.error('File parsing error:', err);
      return { valid: false, error: 'Failed to parse file. Please check the format.' };
    }
  };

  const handleSampleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load sample data immediately (no delay)
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
      let text = '';
      
      // Check file type
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isCsv = fileName.endsWith('.csv') || fileName.endsWith('.txt');
      
      if (isExcel) {
        // For Excel files, we'll need to convert to CSV first
        // Since we can't use external libraries, we'll ask user to save as CSV
        setError("Excel files detected! Please save your Excel file as CSV format and upload again. (File → Save As → CSV)");
        setLoading(false);
        return;
      } else if (isCsv) {
        // Read CSV file
        text = await file.text();
      } else {
        // Try to read as text anyway
        text = await file.text();
      }
      
      // Validate CSV
      const validation = validateCSV(text);
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid file format');
        setLoading(false);
        return;
      }

      // Show warnings if any (but still proceed)
      if (validation.warnings && validation.warnings.length > 0) {
        console.info('File Import Info:', validation.warnings);
      }

      // Pass validated data to parent immediately
      onDataLoaded(validation.data);
    } catch (err) {
      setError("Failed to process file. Please ensure it's a valid CSV or text file.");
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
              accept=".csv,.txt,.xlsx,.xls"
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
                Import your CSV file with shipment data
              </p>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
                <span>Custom Data</span>
                <span>•</span>
                <span>CSV/TXT Format</span>
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
