import axios from "axios";

const api = axios.create({ 
  baseURL: "/api",
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  traffic: string;
  weather: string;
  route_type: string;
  vehicle_type: string;
  historical_delay: number;
  cargo: string;
  eta_hours: number;
  lat_origin: number;
  lng_origin: number;
  lat_dest: number;
  lng_dest: number;
  delay_probability: number;
  expected_delay_minutes: number;
  status: "On Time" | "At Risk" | "Delayed";
  status_color: "green" | "yellow" | "red";
}

export interface SummaryStats {
  total: number;
  on_time: number;
  at_risk: number;
  delayed: number;
  avg_delay_minutes: number;
  on_time_rate: number;
}

export interface RouteOption {
  route: string;
  estimated_delay_minutes: number;
  delay_probability: number;
  risk_level: string;
  recommended: boolean;
}

export interface PredictResponse {
  delay_probability: number;
  expected_delay_minutes: number;
  risk_level: string;
  disruption_factors: string[];
  route_options: RouteOption[];
  recommended_route: string;
}

export interface PredictRequest {
  distance: number;
  traffic: string;
  weather: string;
  route_type: string;
  vehicle_type: string;
  historical_delay: number;
}

export const fetchShipments = () => api.get<Shipment[]>("/shipments/").then((r) => r.data);
export const fetchStats = () => api.get<SummaryStats>("/shipments/summary/stats").then((r) => r.data);
export const predictDelay = (req: PredictRequest) =>
  api.post<PredictResponse>("/predict/", req).then((r) => r.data);
export const fetchWeekly = () => api.get("/analytics/weekly").then((r) => r.data);
export const fetchRiskDist = () => api.get("/analytics/risk-distribution").then((r) => r.data);
export const fetchDelayCauses = () => api.get("/analytics/delay-causes").then((r) => r.data);
export const fetchRoutePerf = () => api.get("/analytics/route-performance").then((r) => r.data);
