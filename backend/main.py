from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predict, shipments, analytics

app = FastAPI(title="ChainGuard AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(shipments.router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/")
def root():
    return {"message": "ChainGuard AI — Predict Delays Before They Happen", "status": "online"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ChainGuard AI Backend"}


@app.get("/api/test")
def api_test():
    return {"message": "API is working", "endpoints": ["/api/predict", "/api/shipments", "/api/analytics"]}

