from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import numpy as np
import cv2
import os

from app.utils.dataset_loader import load_dataset

from app.services.dataset_to_csv import create_csv

from app.services.posture_analysis import (
    extract_landmarks,
    analyze_posture,
    is_model_loaded,
    MODEL_PATH,
)

app = FastAPI()

# ---------------- CORS ----------------
# Comma-separated origins in ALLOWED_ORIGINS, or * for all (local + Vercel + custom domain).
# allow_credentials must be False when using wildcard origins.

_cors_raw = os.getenv("ALLOWED_ORIGINS", "*").strip()
_use_wildcard = _cors_raw in ("", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _use_wildcard else [
        o.strip() for o in _cors_raw.split(",") if o.strip()
    ],
    allow_origin_regex=None if _use_wildcard else os.getenv(
        "ALLOWED_ORIGIN_REGEX", r"https://.*\.vercel\.app"
    ),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ---------------- HOME ----------------

@app.get("/")
def home():
    return {
        "message": "NrityaAI running",
        "model_loaded": is_model_loaded(),
        "model_path": MODEL_PATH,
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY", "").strip()),
    }

# ---------------- CSV GENERATION ----------------

@app.get("/generate-csv")
def generate_csv():

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    dataset_path = os.path.join(
        BASE_DIR,
        "..",
        "..",
        "dataset"
    )

    dataset = load_dataset(dataset_path)

    create_csv(dataset)

    return {
        "message": "CSV generated successfully"
    }

# ---------------- POSTURE ANALYSIS ----------------

@app.post("/analyze-posture")
async def analyze(file: UploadFile = File(...)):

    contents = await file.read()

    nparr = np.frombuffer(contents, np.uint8)

    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return {"error": "Invalid image"}

    landmarks = extract_landmarks(image)

    if landmarks is None:
        return {"error": "No pose detected"}

    result = analyze_posture(landmarks)

    return result