"""
Generate synthetic supply chain dataset for ChainGuard AI.
Run once: python data/generate_dataset.py
"""
import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 1000

traffic_map = {"low": 0, "medium": 1, "high": 2}
weather_map = {"clear": 0, "cloudy": 1, "rain": 2, "storm": 3}
route_map = {"highway": 0, "urban": 1, "mixed": 2}
vehicle_map = {"truck": 0, "van": 1, "bike": 2}

traffic = np.random.choice(["low", "medium", "high"], N, p=[0.4, 0.35, 0.25])
weather = np.random.choice(["clear", "cloudy", "rain", "storm"], N, p=[0.45, 0.25, 0.2, 0.1])
route_type = np.random.choice(["highway", "urban", "mixed"], N, p=[0.4, 0.35, 0.25])
vehicle = np.random.choice(["truck", "van", "bike"], N, p=[0.5, 0.35, 0.15])
distance = np.random.randint(50, 1500, N)
historical_delay = np.random.randint(0, 180, N)  # minutes

# Delay logic: weighted combination
delay_score = (
    np.array([traffic_map[t] for t in traffic]) * 0.3
    + np.array([weather_map[w] for w in weather]) * 0.35
    + np.array([route_map[r] for r in route_type]) * 0.15
    + (distance / 1500) * 0.1
    + (historical_delay / 180) * 0.1
    + np.random.normal(0, 0.05, N)
)

# Normalize to 0-1 and threshold at 0.45
delay_score = np.clip(delay_score / delay_score.max(), 0, 1)
delayed = (delay_score > 0.45).astype(int)

df = pd.DataFrame({
    "shipment_id": [f"S{str(i).zfill(4)}" for i in range(1, N + 1)],
    "distance": distance,
    "traffic": traffic,
    "weather": weather,
    "route_type": route_type,
    "vehicle_type": vehicle,
    "historical_delay": historical_delay,
    "delay_score": np.round(delay_score, 4),
    "delayed": delayed,
})

os.makedirs(os.path.dirname(__file__), exist_ok=True)
df.to_csv(os.path.join(os.path.dirname(__file__), "shipments.csv"), index=False)
print(f"Dataset saved: {len(df)} rows")
print(df["delayed"].value_counts())
