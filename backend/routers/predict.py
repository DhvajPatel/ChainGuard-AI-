from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal
import pickle
import os
import numpy as np

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../ml/model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "../ml/encoders.pkl")

# Load model + encoders at startup
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(ENCODER_PATH, "rb") as f:
        encoders = pickle.load(f)
    MODEL_LOADED = True
except FileNotFoundError:
    MODEL_LOADED = False
    model = None
    encoders = None


class PredictRequest(BaseModel):
    distance: float
    traffic: Literal["low", "medium", "high"]
    weather: Literal["clear", "cloudy", "rain", "storm"]
    route_type: Literal["highway", "urban", "mixed"]
    vehicle_type: Literal["truck", "van", "bike"]
    historical_delay: float = 30.0


class RouteOption(BaseModel):
    route: str
    estimated_delay_minutes: float
    delay_probability: float
    risk_level: str
    recommended: bool


class PredictResponse(BaseModel):
    delay_probability: float
    expected_delay_minutes: float
    risk_level: str
    disruption_factors: list[str]
    route_options: list[RouteOption]
    recommended_route: str


def encode_feature(col: str, value: str) -> int:
    if encoders and col in encoders:
        try:
            return int(encoders[col].transform([value])[0])
        except Exception:
            return 0
    fallback = {
        "traffic": {"low": 0, "medium": 1, "high": 2},
        "weather": {"clear": 0, "cloudy": 1, "rain": 2, "storm": 3},
        "route_type": {"highway": 0, "urban": 1, "mixed": 2},
        "vehicle_type": {"bike": 0, "truck": 1, "van": 2},
    }
    return fallback.get(col, {}).get(value, 0)


def compute_delay_minutes(prob: float, distance: float, traffic: str, weather: str) -> float:
    base = prob * 180  # max 3 hours
    traffic_mult = {"low": 0.5, "medium": 1.0, "high": 1.8}.get(traffic, 1.0)
    weather_mult = {"clear": 0.5, "cloudy": 0.8, "rain": 1.3, "storm": 2.0}.get(weather, 1.0)
    return round(base * traffic_mult * weather_mult * (1 + distance / 5000), 1)


def get_disruption_factors(req: PredictRequest) -> list[str]:
    factors = []
    if req.traffic == "high":
        factors.append("Heavy traffic congestion detected")
    elif req.traffic == "medium":
        factors.append("Moderate traffic on route")
    if req.weather in ("rain", "storm"):
        factors.append(f"Adverse weather: {req.weather} conditions")
    if req.route_type == "urban":
        factors.append("Urban route with multiple stop signals")
    if req.historical_delay > 90:
        factors.append("High historical delay on this corridor")
    if req.distance > 800:
        factors.append("Long-haul route increases exposure to disruptions")
    if not factors:
        factors.append("No significant disruption factors detected")
    return factors


def build_route_options(req: PredictRequest, base_prob: float) -> list[RouteOption]:
    """Generate 3 route alternatives with adjusted risk."""
    options = []

    # Current route
    current_delay = compute_delay_minutes(base_prob, req.distance, req.traffic, req.weather)
    options.append(RouteOption(
        route="Current Route (Direct)",
        estimated_delay_minutes=current_delay,
        delay_probability=round(base_prob * 100, 1),
        risk_level=risk_label(base_prob),
        recommended=False,
    ))

    # Alt 1: Highway bypass — lower traffic exposure
    alt1_traffic = "medium" if req.traffic == "high" else req.traffic
    alt1_prob = max(0.05, base_prob * 0.65)
    alt1_delay = compute_delay_minutes(alt1_prob, req.distance * 1.1, alt1_traffic, req.weather)
    options.append(RouteOption(
        route="Highway Bypass (+10% distance)",
        estimated_delay_minutes=alt1_delay,
        delay_probability=round(alt1_prob * 100, 1),
        risk_level=risk_label(alt1_prob),
        recommended=False,
    ))

    # Alt 2: Alternate city route — avoids weather zone
    alt2_weather = "cloudy" if req.weather in ("rain", "storm") else req.weather
    alt2_prob = max(0.05, base_prob * 0.75)
    alt2_delay = compute_delay_minutes(alt2_prob, req.distance * 1.05, req.traffic, alt2_weather)
    options.append(RouteOption(
        route="Alternate City Route (+5% distance)",
        estimated_delay_minutes=alt2_delay,
        delay_probability=round(alt2_prob * 100, 1),
        risk_level=risk_label(alt2_prob),
        recommended=False,
    ))

    # Mark best option
    best_idx = min(range(len(options)), key=lambda i: options[i].estimated_delay_minutes)
    options[best_idx] = options[best_idx].model_copy(update={"recommended": True})
    return options


def risk_label(prob: float) -> str:
    if prob >= 0.7:
        return "Critical"
    elif prob >= 0.45:
        return "High"
    elif prob >= 0.25:
        return "Medium"
    return "Low"


@router.post("/", response_model=PredictResponse)
def predict_delay(req: PredictRequest):
    if MODEL_LOADED and model is not None:
        features = np.array([[
            req.distance,
            req.historical_delay,
            encode_feature("traffic", req.traffic),
            encode_feature("weather", req.weather),
            encode_feature("route_type", req.route_type),
            encode_feature("vehicle_type", req.vehicle_type),
        ]])
        prob = float(model.predict_proba(features)[0][1])
    else:
        # Rule-based fallback when model not trained yet
        t = {"low": 0.1, "medium": 0.35, "high": 0.7}.get(req.traffic, 0.3)
        w = {"clear": 0.05, "cloudy": 0.2, "rain": 0.5, "storm": 0.85}.get(req.weather, 0.2)
        r = {"highway": 0.1, "mixed": 0.25, "urban": 0.4}.get(req.route_type, 0.2)
        prob = min(0.99, (t * 0.4 + w * 0.4 + r * 0.2) + (req.historical_delay / 600))

    delay_mins = compute_delay_minutes(prob, req.distance, req.traffic, req.weather)
    factors = get_disruption_factors(req)
    route_options = build_route_options(req, prob)
    best = next((o for o in route_options if o.recommended), route_options[0])

    return PredictResponse(
        delay_probability=round(prob * 100, 1),
        expected_delay_minutes=delay_mins,
        risk_level=risk_label(prob),
        disruption_factors=factors,
        route_options=route_options,
        recommended_route=best.route,
    )
