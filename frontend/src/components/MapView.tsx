import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Shipment } from "../api";

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  onSelectShipment: (shipment: Shipment) => void;
}

export default function MapView({ shipments, selectedShipment, onSelectShipment }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const markersRef = useRef<Map<string, { origin: L.Marker; dest: L.Marker }>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on India with appropriate zoom level
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles with dark theme filter
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update shipment routes and markers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing routes and markers
    routeLinesRef.current.forEach((line) => line.remove());
    markersRef.current.forEach(({ origin, dest }) => {
      origin.remove();
      dest.remove();
    });
    routeLinesRef.current.clear();
    markersRef.current.clear();

    // Add routes and markers for each shipment
    shipments.forEach((shipment) => {
      // Determine color based on risk level
      const color = getRouteColor(shipment.status_color);
      const weight = getRouteWeight(shipment.delay_probability);

      // Create origin marker with color-coded icon
      const originIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const originMarker = L.marker([shipment.lat_origin, shipment.lng_origin], {
        icon: originIcon,
        title: `${shipment.origin} (Origin)`,
      }).addTo(map);

      // Create destination marker
      const destIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const destMarker = L.marker([shipment.lat_dest, shipment.lng_dest], {
        icon: destIcon,
        title: `${shipment.destination} (Destination)`,
      }).addTo(map);

      // Create route line between origin and destination
      const routeLine = L.polyline(
        [
          [shipment.lat_origin, shipment.lng_origin],
          [shipment.lat_dest, shipment.lng_dest],
        ],
        {
          color: color,
          weight: weight,
          opacity: 0.7,
          smoothFactor: 1,
        }
      ).addTo(map);

      // Create popup content
      const popupContent = `
        <div style="font-family: system-ui; min-width: 200px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1e293b;">
            ${shipment.id}
          </div>
          <div style="font-size: 12px; color: #475569; line-height: 1.6;">
            <div><strong>Route:</strong> ${shipment.origin} → ${shipment.destination}</div>
            <div><strong>Cargo:</strong> ${shipment.cargo}</div>
            <div><strong>Distance:</strong> ${shipment.distance} km</div>
            <div><strong>Status:</strong> <span style="color: ${color}; font-weight: 600;">${shipment.status}</span></div>
            <div><strong>Delay Risk:</strong> ${shipment.delay_probability}%</div>
            <div><strong>Expected Delay:</strong> ${Math.round(shipment.expected_delay_minutes)} min</div>
          </div>
        </div>
      `;

      // Bind popup to route line
      routeLine.bindPopup(popupContent);

      // Add click handler to route line
      routeLine.on("click", () => {
        onSelectShipment(shipment);
      });

      // Add hover effects
      routeLine.on("mouseover", function (this: L.Polyline) {
        this.setStyle({
          weight: weight + 2,
          opacity: 1,
        });
      });

      routeLine.on("mouseout", function (this: L.Polyline) {
        this.setStyle({
          weight: weight,
          opacity: 0.7,
        });
      });

      // Store references
      routeLinesRef.current.set(shipment.id, routeLine);
      markersRef.current.set(shipment.id, { origin: originMarker, dest: destMarker });
    });
  }, [shipments, onSelectShipment]);

  // Highlight selected shipment route
  useEffect(() => {
    if (!mapRef.current) return;

    // Reset all routes to normal style
    routeLinesRef.current.forEach((line, id) => {
      const shipment = shipments.find((s) => s.id === id);
      if (shipment) {
        const color = getRouteColor(shipment.status_color);
        const weight = getRouteWeight(shipment.delay_probability);
        line.setStyle({
          color: color,
          weight: weight,
          opacity: 0.7,
        });
      }
    });

    // Highlight selected route
    if (selectedShipment) {
      const selectedLine = routeLinesRef.current.get(selectedShipment.id);
      if (selectedLine) {
        const color = getRouteColor(selectedShipment.status_color);
        selectedLine.setStyle({
          color: color,
          weight: 6,
          opacity: 1,
        });
        selectedLine.bringToFront();

        // Pan to selected route
        const bounds = selectedLine.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      }
    }
  }, [selectedShipment, shipments]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-700 shadow-lg"
      style={{
        filter: "brightness(0.9) contrast(1.1)",
      }}
    />
  );
}

// Helper function to get route color based on status
function getRouteColor(statusColor: string): string {
  switch (statusColor) {
    case "green":
      return "#10b981"; // emerald-500
    case "yellow":
      return "#f59e0b"; // amber-500
    case "red":
      return "#ef4444"; // red-500
    default:
      return "#3b82f6"; // blue-500
  }
}

// Helper function to get route weight based on delay probability
function getRouteWeight(delayProbability: number): number {
  if (delayProbability >= 65) return 5; // Delayed - thickest
  if (delayProbability >= 35) return 4; // At Risk - medium
  return 3; // On Time - thinnest
}
