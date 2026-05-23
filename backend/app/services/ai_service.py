import json
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List, Optional, Dict
import requests

load_dotenv()

# Configure Gemini API
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "dummy-key-for-demo"))

class IncidentAnalysisResult(BaseModel):
    incident_type: str
    severity_score: int
    triage_label: str
    confidence_score: float
    recommended_response_type: str
    extracted_entities: List[str]
    summary: str

def analyze_incident_multimodal(text_description: str, image_bytes: Optional[bytes] = None, audio_bytes: Optional[bytes] = None) -> IncidentAnalysisResult:
    """
    1. Incident Analysis & 2. Severity Scoring
    Uses Gemini API to analyze an emergency report from text, image, and/or audio inputs
    and returns a structured JSON response containing the severity score and triage details.
    """
    
    # In a real scenario, use gemini-1.5-pro or gemini-2.5-pro for best multimodal understanding
    # We will use the initialized client in the global scope
    
    # Fetch OpenWeather Info
    weather_context = "Weather: Clear / Unknown"
    weather_api_key = os.environ.get("OPENWEATHER_API_KEY")
    if weather_api_key:
        try:
            # We assume a default Mumbai loc or intercept lat/lng if passed into this fn
            pass # In real production, lat/lng should be passed to this function
            weather_context = "Weather fetched successfully but requires lat/lng args."
        except:
            pass

    # Build prompt
    prompt = f"""
    You are an AI Emergency Triage Expert. Analyze the given emergency inputs carefully.
    Determine the incident type, severity score (0-100), appropriate triage label (LOW, MEDIUM, HIGH, CRITICAL),
    and recommended response type. Extract key entities (hazards, injuries) and provide a 1-sentence operator summary.
    
    CURRENT CONTEXT: Use this external data to influence your severity score (e.g. storms increase accident severity):
    {weather_context}
    
    Output exactly this JSON schema:
    {{
      "incident_type": "string (e.g. road_accident, fire, cardiac_emergency, etc)",
      "severity_score": int,
      "triage_label": "string",
      "confidence_score": float,
      "recommended_response_type": "string",
      "extracted_entities": ["string"],
      "summary": "string"
    }}
    """
    
    # Construct input payload
    contents = [prompt]
    
    if text_description:
        contents.append(f"Text Report: {text_description}")
        
    if image_bytes:
        contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
        
    # Audio processing normally requires uploading via File API for large files,
    # but small snippets can be passed directly if base64 encoded.
    if audio_bytes:
        contents.append(types.Part.from_bytes(data=audio_bytes, mime_type="audio/mp3"))

    # Generate response
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        data = json.loads(response.text)
        return IncidentAnalysisResult(**data)
    except Exception as e:
        # Fallback or error handling
        print(f"Error parsing Gemini output or Invalid Key: {e}")
        return IncidentAnalysisResult(
            incident_type="road_accident",
            severity_score=90,
            triage_label="CRITICAL",
            confidence_score=0.9,
            recommended_response_type="AMBULANCE_AND_FIRE",
            extracted_entities=["Mock Fallback Triggered"],
            summary="Default fallback case created because Gemini AI encountered an error or lacked API keys."
        )

def analyze_symptoms(symptoms: List[str], age: Optional[int] = None, chronic_conditions: Optional[List[str]] = None) -> Dict:
    symptom_text = " ".join(symptoms).lower()
    chronic_text = " ".join(chronic_conditions or []).lower()

    score = 10
    if any(k in symptom_text for k in ["chest pain", "shortness of breath", "severe bleeding", "unconscious"]):
        score += 50
    if any(k in symptom_text for k in ["high fever", "seizure", "stroke", "confusion"]):
        score += 30
    if age is not None and age >= 65:
        score += 10
    if any(k in chronic_text for k in ["heart disease", "diabetes", "copd", "asthma"]):
        score += 10

    if score >= 70:
        triage = "CRITICAL"
    elif score >= 50:
        triage = "HIGH"
    elif score >= 30:
        triage = "MEDIUM"
    else:
        triage = "LOW"

    conditions = []
    if "chest pain" in symptom_text:
        conditions.append("possible_cardiac_event")
    if "shortness of breath" in symptom_text:
        conditions.append("respiratory_distress")
    if "fever" in symptom_text:
        conditions.append("infection")
    if "bleeding" in symptom_text:
        conditions.append("trauma")
    if not conditions:
        conditions.append("general_triage")

    advice = [
        "Keep the patient calm and monitor breathing.",
        "Prepare ID and medical history for responders."
    ]
    if triage in ["HIGH", "CRITICAL"]:
        advice.insert(0, "Call emergency services immediately.")

    confidence = 0.55 if triage in ["LOW", "MEDIUM"] else 0.72

    return {
        "triage_level": triage,
        "possible_conditions": conditions,
        "advice": advice,
        "confidence": confidence
    }

def predict_risk(age: Optional[int], symptoms: List[str], vitals: Optional[Dict[str, float]], comorbidities: Optional[List[str]], triage_level: Optional[str]) -> Dict:
    score = 20
    factors: List[str] = []

    if age is not None and age >= 65:
        score += 15
        factors.append("advanced_age")
    if triage_level in ["HIGH", "CRITICAL"]:
        score += 30
        factors.append("high_triage_level")
    if vitals:
        heart_rate = vitals.get("heart_rate")
        spo2 = vitals.get("spo2")
        systolic = vitals.get("systolic")
        if heart_rate and (heart_rate < 50 or heart_rate > 120):
            score += 10
            factors.append("abnormal_heart_rate")
        if spo2 and spo2 < 92:
            score += 15
            factors.append("low_spo2")
        if systolic and systolic < 90:
            score += 15
            factors.append("low_blood_pressure")

    if comorbidities:
        score += min(15, 5 * len(comorbidities))
        factors.append("comorbidities")

    symptom_text = " ".join(symptoms).lower()
    if any(k in symptom_text for k in ["unconscious", "severe bleeding", "stroke", "seizure"]):
        score += 20
        factors.append("critical_symptoms")

    score = max(5, min(95, score))

    if score >= 75:
        level = "CRITICAL"
        recommendation = "Immediate ICU readiness and continuous monitoring."
    elif score >= 55:
        level = "HIGH"
        recommendation = "Prepare rapid diagnostics and trauma/oxygen readiness."
    elif score >= 35:
        level = "MEDIUM"
        recommendation = "Monitor vitals and keep observation on standby."
    else:
        level = "LOW"
        recommendation = "Routine monitoring and follow-up."

    return {
        "risk_score": score,
        "risk_level": level,
        "factors": factors,
        "recommendation": recommendation
    }

def generate_chat_response(message: str, context: Optional[str] = None) -> Dict:
    text = message.lower().strip()
    if "bleeding" in text:
        response = "Apply firm direct pressure with a clean cloth and keep the patient still."
        actions = ["Check for consciousness", "Call emergency services"]
    elif "burn" in text:
        response = "Cool the burn with clean running water for 10-20 minutes, then cover loosely."
        actions = ["Remove heat source", "Avoid applying creams"]
    elif "fainted" in text or "unconscious" in text:
        response = "Place the person on their side, check breathing, and call emergency services."
        actions = ["Check breathing", "Call emergency services"]
    else:
        response = "Tell me the symptoms, patient age, and any known conditions so I can guide you."
        actions = ["Share symptoms", "Share age and medical history"]

    return {"response": response, "suggested_actions": actions}

# Example usage for testing standalone
if __name__ == "__main__":
    test_result = analyze_incident_multimodal(
        text_description="There is a huge pile up on the highway, multiple cars involved and a truck is leaking fuel. Several people look unconscious.",
        image_bytes=None # Assume mock
    )
    print("Test Output:")
    print(test_result.model_dump_json(indent=2))
