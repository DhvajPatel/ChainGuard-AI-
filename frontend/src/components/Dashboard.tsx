import { useState, useEffect } from "react";
import { fetchShipments, fetchStats, fetchWeekly, fetchRiskDist, fetchDelayCauses, type Shipment, type SummaryStats } from "../api";
import { mockShipments, mockStats, mockRiskData, mockDelayCauses, mockWeeklyData } from "../data/mockData";
import ShipmentTable from "./ShipmentTable";
import StatCard from "./StatCard";
import MapView from "./MapView";
// Removed heavy components: LiveMetrics, AIAssistant, PerformanceScore, ActivityFeed
import DashboardDataSelector from "./DashboardDataSelector";
import { 
  Package, CheckCircle, AlertTriangle, XCircle,
  CloudRain, Navigation, Zap, Brain, Route, Sparkles,
  AlertCircle, Clock, Download, FileText
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [delayCauses, setDelayCauses] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isUploadedData, setIsUploadedData] = useState(false); // Track if data is from upload

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('chainguard_dashboard_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Only restore if we have actual data
        if (parsed.shipments && parsed.shipments.length > 0) {
          setShipments(parsed.shipments);
          setStats(parsed.stats);
          setRiskData(parsed.riskData || []);
          setDelayCauses(parsed.delayCauses || []);
          setWeeklyData(parsed.weeklyData || []);
          setDataLoaded(true);
          setIsUploadedData(parsed.isUploadedData || false);
          console.log('✅ Restored data from localStorage:', parsed.shipments.length, 'shipments');
        } else {
          console.log('⚠️ No valid data in localStorage');
          localStorage.removeItem('chainguard_dashboard_data');
        }
      } catch (err) {
        console.error('❌ Failed to restore data from localStorage:', err);
        localStorage.removeItem('chainguard_dashboard_data');
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (dataLoaded) {
      const dataToSave = {
        shipments,
        stats,
        riskData,
        delayCauses,
        weeklyData,
        dataLoaded,
        isUploadedData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('chainguard_dashboard_data', JSON.stringify(dataToSave));
      
      // Dispatch custom event for same-tab updates (more efficient than polling)
      window.dispatchEvent(new Event('dashboardDataUpdated'));
      
      console.log('💾 Saved data to localStorage');
    }
  }, [shipments, stats, riskData, delayCauses, weeklyData, dataLoaded, isUploadedData]);

  // Process uploaded CSV data into dashboard format
  const processUploadedData = (data: any[]) => {
    try {
      console.log('🔄 Processing', data.length, 'rows...');
      
      if (!data || data.length === 0) {
        throw new Error('No data to process');
      }

      // Convert CSV data to Shipment format with all required fields
      const processedShipments: Shipment[] = data.map((row, index) => {
        const delayProb = Math.random() * 100;
        const status = delayProb >= 65 ? 'Delayed' : delayProb >= 35 ? 'At Risk' : 'On Time';
        
        return {
          id: row.id || `SH${String(index + 1).padStart(3, '0')}`,
          origin: row.origin || 'Unknown',
          destination: row.destination || 'Unknown',
          distance: parseFloat(row.distance) || 0,
          traffic: row.traffic || 'medium',
          weather: row.weather || 'clear',
          route_type: row.route_type || 'highway',
          vehicle_type: row.vehicle_type || 'truck',
          historical_delay: parseFloat(row.historical_delay) || 0,
          cargo: row.cargo || 'General',
          eta_hours: parseFloat(row.eta_hours) || 0,
          delay_probability: delayProb,
          expected_delay_minutes: Math.random() * 60,
          status: status,
          // Add missing required fields with default values
          lat_origin: 40.7128 + (Math.random() - 0.5) * 10,
          lng_origin: -74.0060 + (Math.random() - 0.5) * 20,
          lat_dest: 42.3601 + (Math.random() - 0.5) * 10,
          lng_dest: -71.0589 + (Math.random() - 0.5) * 20,
          status_color: status === 'Delayed' ? 'red' : status === 'At Risk' ? 'yellow' : 'green'
        };
      });

      console.log('✅ Processed', processedShipments.length, 'shipments');

      // Calculate stats
      const total = processedShipments.length;
      const onTime = processedShipments.filter(s => s.status === 'On Time').length;
      const atRisk = processedShipments.filter(s => s.status === 'At Risk').length;
      const delayed = processedShipments.filter(s => s.status === 'Delayed').length;
      const avgDelay = total > 0 ? processedShipments.reduce((sum, s) => sum + s.expected_delay_minutes, 0) / total : 0;

      const processedStats: SummaryStats = {
        total,
        on_time: onTime,
        at_risk: atRisk,
        delayed,
        on_time_rate: total > 0 ? Math.round((onTime / total) * 100) : 0,
        avg_delay_minutes: avgDelay
      };

      console.log('📊 Stats:', processedStats);

    // Calculate risk distribution
    const processedRiskData = [
      { name: 'Low Risk', value: processedShipments.filter(s => s.delay_probability < 35).length },
      { name: 'Medium Risk', value: processedShipments.filter(s => s.delay_probability >= 35 && s.delay_probability < 65).length },
      { name: 'High Risk', value: processedShipments.filter(s => s.delay_probability >= 65 && s.delay_probability < 85).length },
      { name: 'Critical', value: processedShipments.filter(s => s.delay_probability >= 85).length }
    ];

    // Calculate delay causes
    const trafficCount = processedShipments.filter(s => s.traffic === 'high' || s.traffic === 'heavy').length;
    const weatherCount = processedShipments.filter(s => s.weather === 'rainy' || s.weather === 'stormy').length;
    const routeCount = processedShipments.filter(s => s.route_type === 'mixed').length;

    const processedDelayCauses = [
      { cause: 'Traffic', count: trafficCount },
      { cause: 'Weather', count: weatherCount },
      { cause: 'Route', count: routeCount },
      { cause: 'Other', count: Math.max(0, delayed - trafficCount - weatherCount - routeCount) }
    ];

    // Generate weekly data (simulated)
    const processedWeeklyData = [
      { day: 'Mon', on_time: Math.floor(onTime * 0.15), delayed: Math.floor(delayed * 0.15) },
      { day: 'Tue', on_time: Math.floor(onTime * 0.18), delayed: Math.floor(delayed * 0.12) },
      { day: 'Wed', on_time: Math.floor(onTime * 0.16), delayed: Math.floor(delayed * 0.18) },
      { day: 'Thu', on_time: Math.floor(onTime * 0.17), delayed: Math.floor(delayed * 0.20) },
      { day: 'Fri', on_time: Math.floor(onTime * 0.19), delayed: Math.floor(delayed * 0.22) },
      { day: 'Sat', on_time: Math.floor(onTime * 0.08), delayed: Math.floor(delayed * 0.08) },
      { day: 'Sun', on_time: Math.floor(onTime * 0.07), delayed: Math.floor(delayed * 0.05) }
    ];

    setShipments(processedShipments);
    setStats(processedStats);
    setRiskData(processedRiskData);
    setDelayCauses(processedDelayCauses);
    setWeeklyData(processedWeeklyData);
    setDataLoaded(true);
    setIsUploadedData(true); // Mark as uploaded data
    
    console.log('✅ Dashboard data updated successfully');
    } catch (err) {
      console.error('❌ Error processing uploaded data:', err);
      setError('Failed to process uploaded data. Please check the file format.');
      setLoading(false);
    }
  };

  const loadData = async () => {
    // Don't reload if we have uploaded data
    if (isUploadedData) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from backend with timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = Promise.all([
        fetchShipments(), 
        fetchStats(),
        fetchRiskDist().catch(() => []),
        fetchDelayCauses().catch(() => []),
        fetchWeekly().catch(() => [])
      ]);
      
      const [shipmentsData, statsData, riskDist, causes, weekly] = await Promise.race([
        dataPromise,
        timeout
      ]) as any;
      
      setShipments(shipmentsData);
      setStats(statsData);
      setRiskData(riskDist);
      setDelayCauses(causes);
      setWeeklyData(weekly);
      setDataLoaded(true);
      setIsUploadedData(false); // Mark as API data
      console.log('✅ Loaded data from backend API');
    } catch (err: any) {
      console.warn("Backend not available, using mock data:", err.message);
      
      // Fallback to mock data
      setShipments(mockShipments);
      setStats(mockStats);
      setRiskData(mockRiskData);
      setDelayCauses(mockDelayCauses);
      setWeeklyData(mockWeeklyData);
      setDataLoaded(true);
      setIsUploadedData(false);
      console.log('✅ Loaded mock sample data (backend not available)');
    } finally {
      setLoading(false);
    }
  };

  const handleDataLoaded = (data?: any[]) => {
    try {
      if (data) {
        // Uploaded CSV data - process immediately
        console.log('📤 Processing uploaded data:', data.length, 'rows');
        setLoading(true);
        setError(null);
        processUploadedData(data);
        setLoading(false);
        console.log('✅ Upload complete');
      } else {
        // Sample data from backend
        console.log('📥 Loading sample data from backend...');
        setError(null);
        loadData();
        // No auto-refresh - user can manually refresh if needed
      }
    } catch (err) {
      console.error('❌ Error in handleDataLoaded:', err);
      setError('Failed to load data. Please try again.');
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!stats || shipments.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // ============ HEADER ============
    // Logo/Title Section with gradient effect
    doc.setFillColor(6, 182, 212); // Cyan
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('ChainGuard AI', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Supply Chain Analytics Report', pageWidth / 2, 30, { align: 'center' });

    yPosition = 50;

    // ============ REPORT INFO ============
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    const reportDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${reportDate}`, 14, yPosition);
    doc.text(`Data Source: ${isUploadedData ? 'Uploaded Dataset' : 'Sample Data'}`, 14, yPosition + 5);
    yPosition += 15;

    // ============ EXECUTIVE SUMMARY ============
    checkPageBreak(40);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 18, yPosition + 6);
    yPosition += 15;

    // Summary Stats Cards
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const cardWidth = (pageWidth - 38) / 4;
    const cardHeight = 25;
    const cardY = yPosition;
    
    // Card 1: Total Shipments
    doc.setFillColor(59, 130, 246); // Blue
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('TOTAL SHIPMENTS', 14 + cardWidth / 2, cardY + 8, { align: 'center' });
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(stats.total.toString(), 14 + cardWidth / 2, cardY + 18, { align: 'center' });

    // Card 2: On Time
    doc.setFillColor(16, 185, 129); // Green
    doc.roundedRect(14 + cardWidth + 2, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ON TIME', 14 + cardWidth * 1.5 + 2, cardY + 8, { align: 'center' });
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(stats.on_time.toString(), 14 + cardWidth * 1.5 + 2, cardY + 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${stats.on_time_rate}%`, 14 + cardWidth * 1.5 + 2, cardY + 23, { align: 'center' });

    // Card 3: At Risk
    doc.setFillColor(245, 158, 11); // Yellow
    doc.roundedRect(14 + cardWidth * 2 + 4, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.text('AT RISK', 14 + cardWidth * 2.5 + 4, cardY + 8, { align: 'center' });
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(stats.at_risk.toString(), 14 + cardWidth * 2.5 + 4, cardY + 18, { align: 'center' });

    // Card 4: Delayed
    doc.setFillColor(239, 68, 68); // Red
    doc.roundedRect(14 + cardWidth * 3 + 6, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('DELAYED', 14 + cardWidth * 3.5 + 6, cardY + 8, { align: 'center' });
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(stats.delayed.toString(), 14 + cardWidth * 3.5 + 6, cardY + 18, { align: 'center' });

    yPosition += cardHeight + 15;

    // ============ RISK DISTRIBUTION ============
    checkPageBreak(50);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RISK DISTRIBUTION', 18, yPosition + 6);
    yPosition += 15;

    // Risk Distribution Table
    const riskTableData = riskData.map(r => [
      r.name,
      r.value.toString(),
      `${((r.value / stats.total) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Risk Level', 'Count', 'Percentage']],
      body: riskTableData,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ============ DELAY CAUSES ============
    checkPageBreak(50);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DELAY CAUSES ANALYSIS', 18, yPosition + 6);
    yPosition += 15;

    // Delay Causes Table
    const delayCausesTableData = delayCauses.map(d => [
      d.cause,
      d.count.toString(),
      `${((d.count / stats.delayed) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Cause', 'Incidents', 'Impact']],
      body: delayCausesTableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ============ KEY INSIGHTS ============
    checkPageBreak(60);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KEY INSIGHTS & RECOMMENDATIONS', 18, yPosition + 6);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const insights = [
      `✓ Overall Performance: ${stats.on_time_rate}% on-time delivery rate`,
      `✓ Average Delay: ${Math.round(stats.avg_delay_minutes)} minutes per shipment`,
      `✓ High Risk Shipments: ${shipments.filter(s => s.delay_probability >= 65).length} require immediate attention`,
      `✓ Traffic Impact: ${delayCauses.find(d => d.cause === 'Traffic')?.count || 0} delays caused by congestion`,
      `✓ Weather Impact: ${delayCauses.find(d => d.cause === 'Weather')?.count || 0} delays due to weather conditions`
    ];

    insights.forEach((insight, index) => {
      checkPageBreak(10);
      doc.text(insight, 18, yPosition + (index * 8));
    });

    yPosition += insights.length * 8 + 10;

    // ============ SHIPMENT DETAILS ============
    doc.addPage();
    yPosition = 20;

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED SHIPMENT REPORT', 18, yPosition + 6);
    yPosition += 15;

    // Shipments Table
    const shipmentTableData = shipments.slice(0, 50).map(s => [
      s.id,
      `${s.origin} → ${s.destination}`,
      s.status,
      `${s.delay_probability.toFixed(0)}%`,
      `${Math.round(s.expected_delay_minutes)}m`,
      `${s.distance}km`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Route', 'Status', 'Risk', 'Delay', 'Distance']],
      body: shipmentTableData,
      theme: 'striped',
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const status = data.cell.raw as string;
          if (status === 'On Time') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'At Risk') {
            data.cell.styles.textColor = [245, 158, 11];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Delayed') {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // ============ FOOTER ============
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
      
      // Footer text
      doc.text('ChainGuard AI - Predict. Prevent. Optimize.', 14, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
      doc.text(reportDate, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Save the PDF
    const fileName = `ChainGuard_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Get AI insights based on current data
  const getAIInsights = () => {
    if (!stats || shipments.length === 0) return [];
    
    const insights = [];
    const highRiskShipments = shipments.filter(s => s.delay_probability >= 65);
    const trafficIssues = shipments.filter(s => s.traffic === 'heavy');
    const weatherIssues = shipments.filter(s => s.weather === 'rainy' || s.weather === 'stormy');
    
    if (highRiskShipments.length > 0) {
      insights.push({
        type: 'warning',
        message: `${highRiskShipments.length} shipments at critical risk - immediate action recommended`,
        icon: AlertCircle
      });
    }
    
    if (trafficIssues.length > 3) {
      insights.push({
        type: 'info',
        message: `Heavy congestion detected on ${trafficIssues.length} routes - AI suggests alternative paths`,
        icon: Navigation
      });
    }
    
    if (weatherIssues.length > 0) {
      insights.push({
        type: 'alert',
        message: `Weather disruptions affecting ${weatherIssues.length} shipments - delays expected`,
        icon: CloudRain
      });
    }
    
    if (stats.on_time_rate > 80) {
      insights.push({
        type: 'success',
        message: `Excellent performance: ${stats.on_time_rate}% on-time delivery rate`,
        icon: Sparkles
      });
    }
    
    return insights;
  };

  // Get route optimization suggestions
  const getRouteOptimizations = (): Array<{
    shipmentId: string;
    current: string;
    issue: string;
    improvement: string;
    recommended: boolean;
  }> => {
    const optimizations: Array<{
      shipmentId: string;
      current: string;
      issue: string;
      improvement: string;
      recommended: boolean;
    }> = [];
    const atRiskShipments = shipments.filter(s => s.status === 'At Risk').slice(0, 3);
    
    atRiskShipments.forEach(s => {
      optimizations.push({
        shipmentId: s.id,
        current: `${s.origin} → ${s.destination}`,
        issue: s.traffic === 'heavy' ? 'Heavy Traffic' : s.weather === 'rainy' ? 'Weather Risk' : 'Route Bottleneck',
        improvement: `${Math.floor(Math.random() * 30 + 15)}% faster`,
        recommended: true
      });
    });
    
    return optimizations;
  };

  // Get disruption detections
  const getDisruptions = () => {
    const disruptions = [];
    const heavyTraffic = shipments.filter(s => s.traffic === 'heavy').length;
    const badWeather = shipments.filter(s => s.weather === 'rainy' || s.weather === 'stormy').length;
    const highwayRoutes = shipments.filter(s => s.route_type === 'highway' && s.delay_probability > 50).length;
    
    if (heavyTraffic > 0) {
      disruptions.push({
        type: 'traffic',
        severity: heavyTraffic > 5 ? 'high' : 'medium',
        message: `Traffic congestion affecting ${heavyTraffic} routes`,
        icon: Navigation,
        count: heavyTraffic
      });
    }
    
    if (badWeather > 0) {
      disruptions.push({
        type: 'weather',
        severity: badWeather > 3 ? 'high' : 'medium',
        message: `Weather conditions impacting ${badWeather} shipments`,
        icon: CloudRain,
        count: badWeather
      });
    }
    
    if (highwayRoutes > 0) {
      disruptions.push({
        type: 'route',
        severity: 'medium',
        message: `${highwayRoutes} highway routes experiencing delays`,
        icon: Route,
        count: highwayRoutes
      });
    }
    
    return disruptions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-cyan-400 font-semibold text-lg animate-pulse">Initializing ChainGuard AI...</p>
          <p className="text-slate-500 text-sm mt-2">Loading real-time logistics data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Data Selector - Always Visible even on error */}
        <DashboardDataSelector onDataLoaded={handleDataLoaded} />
        
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-2xl">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 border-2 border-red-500/50 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            
            {/* Helpful suggestions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6 text-left">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-cyan-400" />
                Quick Solutions:
              </h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">1.</span>
                  <span><strong>Upload a CSV file</strong> using the "Upload Dataset" option above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">2.</span>
                  <span><strong>Start the backend server:</strong> Run <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">cd backend && python main.py</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">3.</span>
                  <span><strong>Check backend URL:</strong> Ensure it's running on <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">http://localhost:8000</code></span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(false);
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Go Back
              </button>
              <button
                onClick={loadData}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const insights = getAIInsights();
  const optimizations = getRouteOptimizations();
  const disruptions = getDisruptions();

  const RISK_COLORS = ['rgba(18, 212, 134, 1)', '#f59e0b', '#a012c4ff', '#dc2626']; // Green, Yellow, Red, Dark Red

  return (
    <div className="space-y-6">
      {/* Data Selector - Always Visible */}
      <DashboardDataSelector onDataLoaded={handleDataLoaded} />

      {/* Data Source Indicator & Download Report Button */}
      {dataLoaded && stats && (
        <div className="flex justify-between items-center">
          {/* Data Source Badge */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg border backdrop-blur-sm ${
              isUploadedData 
                ? 'bg-blue-500/10 border-blue-500/30' 
                : 'bg-green-500/10 border-green-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isUploadedData ? 'bg-blue-400' : 'bg-green-400'
                }`} />
                <span className={`text-sm font-semibold ${
                  isUploadedData ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {isUploadedData ? 'Uploaded Dataset' : 'Sample Data'} • {stats.total} Shipments
                </span>
              </div>
            </div>
            
            {/* Clear Data Button */}
            <button
              onClick={() => {
                if (confirm('Clear all data? This will remove the current dataset.')) {
                  setShipments([]);
                  setStats(null);
                  setRiskData([]);
                  setDelayCauses([]);
                  setWeeklyData([]);
                  setDataLoaded(false);
                  setIsUploadedData(false);
                  localStorage.removeItem('chainguard_dashboard_data');
                }
              }}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg transition-all text-sm"
            >
              Clear Data
            </button>
          </div>

          {/* Download Report Button */}
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
          >
            <Download size={20} />
            <span>Generate Report</span>
            <FileText size={18} />
          </button>
        </div>
      )}

      {/* Show dashboard content only if data is loaded */}
      {dataLoaded && (
        <>
          {/* Top Stats Grid */}
          {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Shipments"
            value={stats.total}
            icon={<Package />}
            color="blue"
            trend="+12%"
          />
          <StatCard
            title="On Time"
            value={stats.on_time}
            subtitle={`${stats.on_time_rate}% success rate`}
            icon={<CheckCircle />}
            color="green"
            trend="+5%"
          />
          <StatCard
            title="At Risk"
            value={stats.at_risk}
            subtitle="Requires monitoring"
            icon={<AlertTriangle />}
            color="yellow"
            trend="-3%"
          />
          <StatCard
            title="Delayed"
            value={stats.delayed}
            subtitle="Critical attention"
            icon={<XCircle />}
            color="red"
            trend="-8%"
          />
          <StatCard
            title="Avg Delay"
            value={`${Math.round(stats.avg_delay_minutes)}m`}
            subtitle="Expected delay time"
            icon={<Clock />}
            color="purple"
            trend="-15%"
          />
        </div>
      )}

      {/* Main Dashboard Grid - Enhanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Shipments & Map (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Shipment Monitor */}
          <ShipmentTable
            shipments={shipments}
            onSelect={setSelectedShipment}
            selected={selectedShipment}
          />

          {/* Map View */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Navigation className="text-cyan-400" size={20} />
                Live Route Tracking
              </h3>
            </div>
            <div className="h-[400px]">
              <MapView
                shipments={shipments}
                selectedShipment={selectedShipment}
                onSelectShipment={setSelectedShipment}
              />
            </div>
          </div>
        </div>

        {/* Right Column - AI Panels (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Risk Assessment Panel */}
          {selectedShipment && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 animate-in fade-in slide-in-from-right duration-300">
              <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-blue-900/40">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Brain className="text-purple-400" size={20} />
                  AI Risk Analysis
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Circular Risk Indicator */}
                <div className="flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-800"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - selectedShipment.delay_probability / 100)}`}
                        className={`${
                          selectedShipment.delay_probability >= 65
                            ? 'text-red-500'
                            : selectedShipment.delay_probability >= 35
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        } transition-all duration-1000`}
                        style={{
                          filter: 'drop-shadow(0 0 8px currentColor)'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-black text-white">{selectedShipment.delay_probability}%</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Delay Risk</div>
                    </div>
                  </div>
                </div>

                {/* Risk Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Expected Delay</span>
                    <span className="text-white font-bold">
                      {selectedShipment.expected_delay_minutes > 0
                        ? `+${Math.round(selectedShipment.expected_delay_minutes)} min`
                        : 'On Schedule'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Risk Level</span>
                    <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                      selectedShipment.status === 'Delayed'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : selectedShipment.status === 'At Risk'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-green-500/20 text-green-400 border border-green-500/50'
                    }`}>
                      {selectedShipment.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Shipment ID</span>
                    <span className="text-cyan-400 font-mono font-bold">{selectedShipment.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disruption Detection */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10">
            <div className="px-6 py-4 border-b border-red-500/20 bg-gradient-to-r from-red-900/40 to-orange-900/40">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertCircle className="text-red-400" size={20} />
                Disruption Detection
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {disruptions.length > 0 ? (
                disruptions.map((d, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border backdrop-blur-sm animate-in fade-in slide-in-from-left duration-300 ${
                      d.severity === 'high'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        d.severity === 'high' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                      }`}>
                        <d.icon size={18} className={d.severity === 'high' ? 'text-red-400' : 'text-yellow-400'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-semibold text-sm">{d.message}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            d.severity === 'high' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'
                          }`}>
                            {d.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs">Active alerts: {d.count}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-green-400 font-semibold">All Systems Optimal</p>
                  <p className="text-slate-500 text-sm mt-1">No disruptions detected</p>
                </div>
              )}
            </div>
          </div>

          {/* Smart Route Optimization */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Zap className="text-cyan-400" size={20} />
                Smart Route Optimization
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {optimizations.length > 0 ? (
                optimizations.map((opt, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-right duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-cyan-400 font-mono text-xs font-bold">#{opt.shipmentId}</span>
                      {opt.recommended && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg shadow-cyan-500/50">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className="text-white text-sm font-semibold mb-1">{opt.current}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-400">Issue: {opt.issue}</span>
                      <span className="text-green-400 font-bold">↓ {opt.improvement}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Route className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">All routes optimized</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
            <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-pink-900/40">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Brain className="text-purple-400" size={20} />
                AI Insights
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-300"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <insight.icon size={16} className="text-purple-400" />
                    </div>
                    <p className="text-slate-300 text-sm flex-1">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        {riskData.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20">
              <h3 className="text-white font-bold">Risk Distribution</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {riskData.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={RISK_COLORS[index % RISK_COLORS.length]}
                        stroke={RISK_COLORS[index % RISK_COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {riskData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full shadow-lg" 
                      style={{ 
                        backgroundColor: RISK_COLORS[index],
                        boxShadow: `0 0 10px ${RISK_COLORS[index]}50`
                      }} 
                    />
                    <span className="text-white font-semibold text-sm">{entry.name}</span>
                    <span className="text-slate-400 text-xs">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delay Causes */}
        {delayCauses.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20">
              <h3 className="text-white font-bold">Delay Causes</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={delayCauses}>
                  <XAxis dataKey="cause" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekly Performance */}
        {weeklyData.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <div className="px-6 py-4 border-b border-cyan-500/20">
              <h3 className="text-white font-bold">Weekly Performance</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="on_time" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                  <Line type="monotone" dataKey="delayed" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

        </>
      )}
    </div>
  );
}
