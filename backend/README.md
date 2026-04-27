---
title: ChainGuard AI Backend
emoji: 🚚
colorFrom: blue
colorTo: green
sdk: docker
app_file: main.py
pinned: false
---

# ChainGuard AI Backend

Smart Supply Chain Optimization Platform - AI-powered delay prediction and route optimization.

## 🚀 Features

- **AI Delay Prediction**: Predict shipment delays using intelligent rule-based AI
- **Sample Data API**: Pre-loaded sample shipments for instant testing
- **Analytics Dashboard**: Risk distribution, delay causes, and performance metrics
- **Route Optimization**: Get alternative route suggestions with risk analysis
- **Zero ML Dependency**: Works without trained ML model using intelligent fallback

## 🔌 API Endpoints

### Core Endpoints

- `GET /` - Root endpoint - API status
- `GET /health` - Health check
- `GET /api/test` - API test endpoint

### Shipments

- `GET /api/shipments/` - Get all shipments with risk analysis
- `GET /api/shipments/{id}` - Get specific shipment
- `GET /api/shipments/summary/stats` - Get summary statistics

### Prediction

- `POST /api/predict/` - Predict shipment delay

**Request Body:**
```json
{
  "distance": 500,
  "traffic": "medium",
  "weather": "clear",
  "route_type": "highway",
  "vehicle_type": "truck",
  "historical_delay": 30
}
```

**Response:**
```json
{
  "delay_probability": 35.5,
  "expected_delay_minutes": 25.3,
  "risk_level": "Medium",
  "disruption_factors": ["Moderate traffic on route"],
  "route_options": [
    {
      "route": "Current Route (Direct)",
      "estimated_delay_minutes": 25.3,
      "delay_probability": 35.5,
      "risk_level": "Medium",
      "recommended": false
    },
    {
      "route": "Highway Bypass (+10% distance)",
      "estimated_delay_minutes": 18.2,
      "delay_probability": 23.1,
      "risk_level": "Low",
      "recommended": true
    }
  ],
  "recommended_route": "Highway Bypass (+10% distance)"
}
```

### Analytics

- `GET /api/analytics/weekly` - Weekly performance data
- `GET /api/analytics/risk-distribution` - Risk distribution chart data
- `GET /api/analytics/delay-causes` - Delay causes breakdown
- `GET /api/analytics/route-performance` - Route performance metrics

## 🧪 Testing

### Quick Test

Visit the root endpoint:
```
https://YOUR-SPACE-NAME.hf.space/
```

Expected response:
```json
{
  "message": "ChainGuard AI — Predict Delays Before They Happen",
  "status": "online"
}
```

### Interactive API Documentation

Visit the Swagger UI:
```
https://YOUR-SPACE-NAME.hf.space/docs
```

### Test Prediction Endpoint

```bash
curl -X POST https://YOUR-SPACE-NAME.hf.space/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "distance": 500,
    "traffic": "high",
    "weather": "rain",
    "route_type": "urban",
    "vehicle_type": "truck",
    "historical_delay": 45
  }'
```

## 🤖 AI Prediction Logic

The backend uses a **rule-based AI system** that works without requiring a trained ML model:

### Risk Calculation Formula

```python
traffic_score = {"low": 0.1, "medium": 0.35, "high": 0.7}
weather_score = {"clear": 0.05, "cloudy": 0.2, "rain": 0.5, "storm": 0.85}
route_score = {"highway": 0.1, "mixed": 0.25, "urban": 0.4}

delay_probability = (
    traffic_score * 0.4 +
    weather_score * 0.4 +
    route_score * 0.2 +
    historical_delay / 600
)
```

### Risk Levels

- **Low**: < 25% delay probability
- **Medium**: 25-45% delay probability
- **High**: 45-70% delay probability
- **Critical**: > 70% delay probability

### Route Optimization

The system generates 3 route alternatives:
1. **Current Route**: Direct path with current conditions
2. **Highway Bypass**: +10% distance, reduced traffic exposure (-35% risk)
3. **Alternate City Route**: +5% distance, avoids weather zones (-25% risk)

## 📊 Sample Data

The backend includes 10 pre-loaded sample shipments covering major Indian logistics routes:
- Mumbai → Delhi (1420 km)
- Bangalore → Chennai (346 km)
- Ahmedabad → Mumbai (524 km)
- Kolkata → Bhubaneswar (440 km)
- Delhi → Jaipur (281 km)
- Hyderabad → Vijayawada (275 km)
- Pune → Goa (464 km)
- Chennai → Coimbatore (507 km)
- Surat → Indore (412 km)
- Mumbai → Pune (148 km)

## 🔧 Technology Stack

- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Docker** - Containerization

## 📝 License

MIT License

## 🤝 Contributing

This is part of the ChainGuard AI project - a smart supply chain optimization platform.

---

**Built with ❤️ using FastAPI**
