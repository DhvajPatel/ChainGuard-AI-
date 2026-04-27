"""
Train and persist the delay prediction model.
Run once: python ml/train_model.py
"""
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/shipments.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "encoders.pkl")

df = pd.read_csv(DATA_PATH)

# Encode categoricals
encoders = {}
cat_cols = ["traffic", "weather", "route_type", "vehicle_type"]
for col in cat_cols:
    le = LabelEncoder()
    df[col + "_enc"] = le.fit_transform(df[col])
    encoders[col] = le

feature_cols = ["distance", "historical_delay"] + [c + "_enc" for c in cat_cols]
X = df[feature_cols]
y = df["delayed"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
print(classification_report(y_test, y_pred))

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)
with open(ENCODER_PATH, "wb") as f:
    pickle.dump(encoders, f)

print(f"Model saved to {MODEL_PATH}")
print(f"Encoders saved to {ENCODER_PATH}")
