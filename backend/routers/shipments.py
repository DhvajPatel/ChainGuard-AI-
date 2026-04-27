from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal
import random

router = APIRouter()

# Static demo shipments — realistic Indian logistics corridors
DEMO_SHIPMENTS = [
    {
        "id": "S001",
        "origin": "Ahmedabad",
        "destination": "Mumbai",
        "distance": 524,
        "traffic": "high",
        "weather": "rain",
        "route_type": "highway",
        "vehicle_type": "truck",
        "historical_delay": 95,
        "cargo": "Electronics",
        "eta_hours": 8.5,
        "lat_origin": 23.0225, "lng_origin": 72.5714,
        "lat_dest": 19.0760, "lng_dest": 72.8777,
    },
    {
        "id": "S002",
        "origin": "Delhi",
        "destination": "Jaipur",
        "distance": 281,
        "traffic": "low",
        "weather": "clear",
        "route_type": "highway",
        "vehicle_type": "van",
        "historical_delay": 20,
        "cargo": "Pharmaceuticals",
        "eta_hours": 4.5,
        "lat_origin": 28.6139, "lng_origin": 77.2090,
        "lat_dest": 26.9124, "lng_dest": 75.7873,
    },
    {
        "id": "S003",
        "origin": "Mumbai",
        "destination": "Pune",
        "distance": 148,
        "traffic": "high",
        "weather": "storm",
        "route_type": "urban",
        "vehicle_type": "truck",
        "historical_delay": 120,
        "cargo": "Auto Parts",
        "eta_hours": 3.0,
        "lat_origin": 19.0760, "lng_origin": 72.8777,
        "lat_dest": 18.5204, "lng_dest": 73.8567,
    },
    {
        "id": "S004",
        "origin": "Chennai",
        "destination": "Bangalore",
        "distance": 346,
        "traffic": "medium",
        "weather": "cloudy",
        "route_type": "mixed",
        "vehicle_type": "truck",
        "historical_delay": 45,
        "cargo": "FMCG",
        "eta_hours": 6.0,
        "lat_origin": 13.0827, "lng_origin": 80.2707,
        "lat_dest": 12.9716, "lng_dest": 77.5946,
    },
    {
        "id": "S005",
        "origin": "Kolkata",
        "destination": "Bhubaneswar",
        "distance": 440,
        "traffic": "medium",
        "weather": "rain",
        "route_type": "highway",
        "vehicle_type": "van",
        "historical_delay": 60,
        "cargo": "Textiles",
        "eta_hours": 7.0,
        "lat_origin": 22.5726, "lng_origin": 88.3639,
        "lat_dest": 20.2961, "lng_dest": 85.8245,
    },
    {
        "id": "S006",
        "origin": "Hyderabad",
        "destination": "Vijayawada",
        "distance": 275,
        "traffic": "low",
        "weather": "clear",
        "route_type": "highway",
        "vehicle_type": "truck",
        "historical_delay": 15,
        "cargo": "Food & Beverages",
        "eta_hours": 4.0,
        "lat_origin": 17.3850, "lng_origin": 78.4867,
        "lat_dest": 16.5062, "lng_dest": 80.6480,
    },
]


def compute_risk(shipment: dict) -> dict:
    t = {"low": 0.1, "medium": 0.35, "high": 0.7}.get(shipment["traffic"], 0.3)
    w = {"clear": 0.05, "cloudy": 0.2, "rain": 0.5, "storm": 0.85}.get(shipment["weather"], 0.2)
    r = {"highway": 0.1, "mixed": 0.25, "urban": 0.4}.get(shipment["route_type"], 0.2)
    prob = min(0.99, t * 0.4 + w * 0.4 + r * 0.2 + shipment["historical_delay"] / 600)

    if prob >= 0.65:
        status = "Delayed"
        color = "red"
    elif prob >= 0.35:
        status = "At Risk"
        color = "yellow"
    else:
        status = "On Time"
        color = "green"

    delay_mins = round(prob * 180 * (1 + shipment["distance"] / 5000), 1)
    return {
        **shipment,
        "delay_probability": round(prob * 100, 1),
        "expected_delay_minutes": delay_mins,
        "status": status,
        "status_color": color,
    }


@router.get("/")
def get_shipments():
    return [compute_risk(s) for s in DEMO_SHIPMENTS]


@router.get("/{shipment_id}")
def get_shipment(shipment_id: str):
    for s in DEMO_SHIPMENTS:
        if s["id"] == shipment_id:
            return compute_risk(s)
    return {"error": "Shipment not found"}


@router.get("/summary/stats")
def get_summary():
    enriched = [compute_risk(s) for s in DEMO_SHIPMENTS]
    on_time = sum(1 for s in enriched if s["status"] == "On Time")
    at_risk = sum(1 for s in enriched if s["status"] == "At Risk")
    delayed = sum(1 for s in enriched if s["status"] == "Delayed")
    avg_delay = round(sum(s["expected_delay_minutes"] for s in enriched) / len(enriched), 1)
    on_time_rate = round(on_time / len(enriched) * 100, 1)
    return {
        "total": len(enriched),
        "on_time": on_time,
        "at_risk": at_risk,
        "delayed": delayed,
        "avg_delay_minutes": avg_delay,
        "on_time_rate": on_time_rate,
    }
