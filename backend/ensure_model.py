"""
Generate training_data.csv and pose_model.pkl when missing.
Run during Render build: pip install -r requirements.txt && python ensure_model.py
"""
from __future__ import annotations

import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

DATASET_PATH = os.path.join(BACKEND_DIR, "..", "dataset")
MODEL_PATH = os.path.join(BACKEND_DIR, "pose_model.pkl")
CSV_PATH = os.path.join(BACKEND_DIR, "training_data.csv")


def main() -> None:
    if os.path.exists(MODEL_PATH):
        print(f"Model already present: {MODEL_PATH}")
        return

    from app.utils.dataset_loader import load_dataset, create_csv

    print("pose_model.pkl missing — training from dataset…")
    dataset = load_dataset(DATASET_PATH)
    if not dataset:
        print(f"No dataset images found under {DATASET_PATH}")
        sys.exit(1)

    create_csv(dataset)
    if not os.path.exists(CSV_PATH):
        print("Failed to create training_data.csv")
        sys.exit(1)

    import pandas as pd
    import joblib
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score

    df = pd.read_csv(CSV_PATH)
    X = df.drop("label", axis=1)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=500, max_depth=20, random_state=42
    )
    model.fit(X_train, y_train)
    acc = accuracy_score(y_test, model.predict(X_test))
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH} (test accuracy: {acc:.3f})")


if __name__ == "__main__":
    main()
