from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal
import json
import os

router = APIRouter()

# Load sample shipments from JSON file
SAMPLE_DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/sample_shipments.json")

def load_sample_shipments():
    """Load sample shipments from JSON file, with fallback to empty list."""
    try:
        with open(SAMPLE_DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Remove pre-computed fields if they exist (we'll compute them dynamically)
            for shipment in data:
                shipment.pop("delay_probability", None)
                shipment.pop("expected_delay_minutes", None)
                shipment.pop("status", None)
                shipment.pop("status_color", None)
            return data
    except FileNotFoundError:
        print(f"Warning: Sample data file not found at {SAMPLE_DATA_PATH}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing sample data JSON: {e}")
        return []

DEMO_SHIPMENTS = load_sample_shipments()


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
