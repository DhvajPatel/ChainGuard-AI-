from fastapi import APIRouter

router = APIRouter()

# Pre-computed analytics for the demo dashboard
WEEKLY_PERFORMANCE = [
    {"day": "Mon", "on_time": 85, "delayed": 15, "avg_delay": 42},
    {"day": "Tue", "on_time": 78, "delayed": 22, "avg_delay": 67},
    {"day": "Wed", "on_time": 91, "delayed": 9, "avg_delay": 28},
    {"day": "Thu", "on_time": 72, "delayed": 28, "avg_delay": 89},
    {"day": "Fri", "on_time": 68, "delayed": 32, "avg_delay": 112},
    {"day": "Sat", "on_time": 88, "delayed": 12, "avg_delay": 35},
    {"day": "Sun", "on_time": 94, "delayed": 6, "avg_delay": 18},
]

RISK_DISTRIBUTION = [
    {"name": "Low Risk", "value": 38, "color": "#22c55e"},
    {"name": "Medium Risk", "value": 27, "color": "#eab308"},
    {"name": "High Risk", "value": 22, "color": "#f97316"},
    {"name": "Critical", "value": 13, "color": "#ef4444"},
]

DELAY_CAUSES = [
    {"cause": "Traffic", "count": 142, "percentage": 38},
    {"cause": "Weather", "count": 98, "percentage": 26},
    {"cause": "Route Issues", "count": 67, "percentage": 18},
    {"cause": "Vehicle", "count": 45, "percentage": 12},
    {"cause": "Other", "count": 23, "percentage": 6},
]

ROUTE_PERFORMANCE = [
    {"route": "Ahmedabad→Mumbai", "on_time_rate": 62, "avg_delay": 95},
    {"route": "Delhi→Jaipur", "on_time_rate": 91, "avg_delay": 18},
    {"route": "Mumbai→Pune", "on_time_rate": 54, "avg_delay": 128},
    {"route": "Chennai→Bangalore", "on_time_rate": 79, "avg_delay": 52},
    {"route": "Kolkata→Bhubaneswar", "on_time_rate": 74, "avg_delay": 63},
]


@router.get("/weekly")
def weekly_performance():
    return WEEKLY_PERFORMANCE


@router.get("/risk-distribution")
def risk_distribution():
    return RISK_DISTRIBUTION


@router.get("/delay-causes")
def delay_causes():
    return DELAY_CAUSES


@router.get("/route-performance")
def route_performance():
    return ROUTE_PERFORMANCE
