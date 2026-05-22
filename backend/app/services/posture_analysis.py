import numpy as np
import mediapipe as mp
import cv2
import pandas as pd
import joblib
import os

mp_pose = mp.solutions.pose

# ---------------- LOAD MODEL ----------------

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PATH = os.path.join(BACKEND_DIR, "pose_model.pkl")

model = None


def is_model_loaded() -> bool:
    return model is not None


if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
else:
    print(f"Model not found at {MODEL_PATH} — pose names will show as 'none'")


# ---------------- DISTANCE ----------------

def distance(a, b):
    return np.linalg.norm(
        np.array([a["x"], a["y"]]) -
        np.array([b["x"], b["y"]])
    )


# ---------------- ANGLE ----------------

def calculate_angle(a, b, c):

    a = np.array([a["x"], a["y"]])
    b = np.array([b["x"], b["y"]])
    c = np.array([c["x"], c["y"]])

    ba = a - b
    bc = c - b

    if np.linalg.norm(ba) == 0 or np.linalg.norm(bc) == 0:
        return 0

    cosine = np.dot(ba, bc) / (
        np.linalg.norm(ba) * np.linalg.norm(bc)
    )

    cosine = np.clip(cosine, -1.0, 1.0)

    angle = np.arccos(cosine)

    return np.degrees(angle)


# ---------------- LANDMARK EXTRACTION ----------------

def extract_landmarks(image):

    with mp_pose.Pose(static_image_mode=True) as pose:

        results = pose.process(
            cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        )

        if not results.pose_landmarks:
            return None

        landmarks = []

        for lm in results.pose_landmarks.landmark:
            landmarks.append({
                "x": lm.x,
                "y": lm.y
            })

        return landmarks


# ---------------- FEATURE EXTRACTION ----------------

def get_features(landmarks):

    features = {}

    # ---------------- CORE ANGLES ----------------

    features["left_knee"] = calculate_angle(
        landmarks[23], landmarks[25], landmarks[27]
    )

    features["right_knee"] = calculate_angle(
        landmarks[24], landmarks[26], landmarks[28]
    )

    features["left_elbow"] = calculate_angle(
        landmarks[11], landmarks[13], landmarks[15]
    )

    features["right_elbow"] = calculate_angle(
        landmarks[12], landmarks[14], landmarks[16]
    )

    features["left_hip"] = calculate_angle(
        landmarks[11], landmarks[23], landmarks[25]
    )

    features["right_hip"] = calculate_angle(
        landmarks[12], landmarks[24], landmarks[26]
    )

    features["left_shoulder"] = calculate_angle(
        landmarks[13], landmarks[11], landmarks[23]
    )

    features["right_shoulder"] = calculate_angle(
        landmarks[14], landmarks[12], landmarks[24]
    )

    # ---------------- BODY DISTANCES ----------------

    shoulder_width = distance(
        landmarks[11],
        landmarks[12]
    )

    hip_width = distance(
        landmarks[23],
        landmarks[24]
    )

    knee_width = distance(
        landmarks[25],
        landmarks[26]
    )

    ankle_width = distance(
        landmarks[27],
        landmarks[28]
    )

    wrist_width = distance(
        landmarks[15],
        landmarks[16]
    )

    if shoulder_width == 0:
        shoulder_width = 1

    features["hip_width_norm"] = hip_width / shoulder_width
    features["knee_width_norm"] = knee_width / shoulder_width
    features["ankle_width_norm"] = ankle_width / shoulder_width
    features["wrist_width_norm"] = wrist_width / shoulder_width

    # ---------------- SYMMETRY ----------------

    features["knee_symmetry"] = abs(
        features["left_knee"] -
        features["right_knee"]
    )

    features["elbow_symmetry"] = abs(
        features["left_elbow"] -
        features["right_elbow"]
    )

    # ---------------- TORSO FEATURES ----------------

    features["shoulder_slope"] = abs(
        landmarks[11]["y"] -
        landmarks[12]["y"]
    )

    features["hip_slope"] = abs(
        landmarks[23]["y"] -
        landmarks[24]["y"]
    )

    # ---------------- NORMALIZED LANDMARKS ----------------

    center_x = (
        landmarks[23]["x"] +
        landmarks[24]["x"]
    ) / 2

    center_y = (
        landmarks[23]["y"] +
        landmarks[24]["y"]
    ) / 2

    for i, lm in enumerate(landmarks):

        features[f"x_{i}"] = (
            lm["x"] - center_x
        ) / shoulder_width

        features[f"y_{i}"] = (
            lm["y"] - center_y
        ) / shoulder_width

    return features


# ---------------- STABILITY HELPERS ----------------

def frame_signature(features: dict) -> str:
    """Compact signature for near-duplicate frame detection."""
    keys = (
        "left_knee",
        "right_knee",
        "knee_symmetry",
        "shoulder_slope",
        "hip_slope",
    )
    parts = [str(round(float(features[k]), 1)) for k in keys]
    return "|".join(parts)


def smooth_confidence(raw: float, matched: bool) -> float:
    if matched:
        return round(min(0.99, raw * 0.96 + 0.04), 2)
    return round(raw * 0.88, 2)


# ---------------- ML CLASSIFICATION ----------------

def classify_pose(features):

    if model is None:
        print("Model not loaded, returning none")
        return {
            "pose": "none",
            "predicted_pose": None,
            "confidence": 0,
            "matched": False,
            "locked": False,
            "model_loaded": False,
        }

    X = pd.DataFrame([features])

    prediction = str(model.predict(X)[0])

    probabilities = model.predict_proba(X)[0]
    confidence = float(np.max(probabilities))

    matched = confidence >= 0.60
    pose = prediction if matched else "none"
    display_conf = smooth_confidence(confidence, matched)

    print(
        f"Prediction: {prediction}, Confidence: {confidence:.2f}, "
        f"Final pose: {pose}, matched: {matched}"
    )

    return {
        "pose": pose,
        "predicted_pose": prediction,
        "confidence": display_conf,
        "matched": matched,
        "locked": matched and pose != "none",
        "model_loaded": True,
    }


# ---------------- FEEDBACK ----------------

def generate_feedback(features):

    feedback = []

    if (
        features["left_knee"] > 100 or
        features["right_knee"] > 100
    ):
        feedback.append("Bend your knees more")

    if (
        features["shoulder_slope"] > 0.05
    ):
        feedback.append("Keep shoulders balanced")

    if (
        features["hip_slope"] > 0.05
    ):
        feedback.append("Keep hips aligned")

    if (
        features["knee_symmetry"] > 15
    ):
        feedback.append("Balance both legs evenly")

    return feedback


# ---------------- MAIN ANALYSIS ----------------

def analyze_posture(landmarks):

    features = get_features(landmarks)

    classification = classify_pose(features)

    # Improved posture scoring with weights
    # Prioritize: knee geometry (30%), symmetry (25%), hip alignment (20%), spine alignment (15%), other (10%)
    knee_score = max(0, 100 - (abs(features["left_knee"] - 90) + abs(features["right_knee"] - 90)) / 2)
    symmetry_score = max(0, 100 - (features["knee_symmetry"] + features["elbow_symmetry"]) / 2)
    hip_score = max(0, 100 - features["hip_slope"] * 1000)  # Normalize hip slope
    spine_score = max(0, 100 - features["shoulder_slope"] * 1000)  # Normalize shoulder slope
    other_score = max(0, 100 - (features["left_elbow"] + features["right_elbow"]) / 2)  # Elbow angles

    posture_score = (
        knee_score * 0.3 +
        symmetry_score * 0.25 +
        hip_score * 0.2 +
        spine_score * 0.15 +
        other_score * 0.1
    )

    rule_feedback = generate_feedback(features)

    from app.services.gemini_feedback import (
        build_feature_summary,
        generate_gemini_feedback,
    )

    feature_summary = build_feature_summary(features)
    coaching_pose = classification["pose"]
    if coaching_pose == "none":
        coaching_pose = classification.get("predicted_pose") or "unknown"

    feedback = generate_gemini_feedback(
        coaching_pose,
        round(posture_score, 2),
        feature_summary,
        rule_feedback,
    )

    locked = bool(classification.get("locked")) or (
        classification["matched"] and classification["pose"] != "none"
    )

    result = {
        "pose": classification["pose"],
        "predicted_pose": classification.get("predicted_pose"),
        "confidence": classification["confidence"],
        "matched": classification["matched"],
        "locked": locked,
        "model_loaded": classification.get("model_loaded", is_model_loaded()),
        "posture_score": round(posture_score, 2),
        "feedback": feedback,
        "feature_summary": feature_summary,
        "frame_signature": frame_signature(features),
    }

    print(f"Analysis result: {result}")

    return result