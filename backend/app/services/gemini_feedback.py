"""Gemini-powered Bharatanatyam coaching lines (server-side only)."""

from __future__ import annotations

import os
import re
from typing import Any

MAX_LINES = 2


def build_feature_summary(features: dict[str, Any]) -> dict[str, Any]:
    return {
        "left_knee_deg": round(float(features["left_knee"]), 1),
        "right_knee_deg": round(float(features["right_knee"]), 1),
        "knee_symmetry_diff": round(float(features["knee_symmetry"]), 1),
        "elbow_symmetry_diff": round(float(features["elbow_symmetry"]), 1),
        "shoulder_slope": round(float(features["shoulder_slope"]), 3),
        "hip_slope": round(float(features["hip_slope"]), 3),
    }


def _fallback_feedback(rule_feedback: list[str]) -> list[str]:
    if rule_feedback:
        cleaned = [str(x).strip() for x in rule_feedback if str(x).strip()]
        if cleaned:
            return cleaned[:MAX_LINES]
    return [
        "Lower your araimandi slightly for stronger balance.",
        "Keep both shoulders aligned for classical symmetry.",
    ]


def _parse_coaching_lines(text: str) -> list[str]:
    raw = text.replace("\r", "\n").strip()
    parts = re.split(r"[\n]+|(?<=[.!?])\s+", raw)
    lines: list[str] = []
    for part in parts:
        line = re.sub(r"^[-•*#\d.]+\s*", "", part.strip())
        line = re.sub(r"\*+", "", line).strip()
        if len(line) < 12:
            continue
        if not line.endswith((".", "!", "?")):
            line += "."
        lines.append(line)
        if len(lines) >= MAX_LINES:
            break
    return lines[:MAX_LINES]


def generate_gemini_feedback(
    pose: str,
    posture_score: float,
    feature_summary: dict[str, Any],
    rule_feedback: list[str],
) -> list[str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    pose_label = (pose or "unknown").strip()

    if not api_key or pose_label.lower() in ("none", "unknown", ""):
        return _fallback_feedback(rule_feedback)

    prompt = f"""You are a senior Bharatanatyam guru giving brief studio corrections.

Pose: {pose_label}
Alignment score (0-100): {posture_score}
Body metrics: {feature_summary}
Observed issues: {rule_feedback or "subtle refinements only"}

Write exactly 2 lines. Each line is one complete correction (under 85 characters).
Use classical terms when natural: araimandi, ardhamandala, hastas, samapadam, muzhumandi.
Be specific to the metrics. Sound human, calm, expert.
Forbidden: markdown, bullets, numbering, "AI", "as a model", generic praise, repetition.
Output only the two lines, separated by a newline."""

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.45,
                "max_output_tokens": 180,
            },
        )
        text = (response.text or "").strip()
        lines = _parse_coaching_lines(text)
        if len(lines) >= 2:
            return lines[:MAX_LINES]
        if len(lines) == 1:
            fallback = _fallback_feedback(rule_feedback)
            return [lines[0], fallback[0] if fallback else "Soften the shoulders and lengthen the neck line."]
        return _fallback_feedback(rule_feedback)
    except Exception as exc:
        print(f"Gemini feedback failed: {exc}")
        return _fallback_feedback(rule_feedback)
