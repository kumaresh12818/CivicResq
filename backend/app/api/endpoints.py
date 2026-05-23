from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.models import (
    ReportRequest,
    VoiceSosRequest,
    IncidentResponse,
    PatientRegisterRequest,
    PatientRecord,
    SymptomCheckRequest,
    SymptomCheckResponse,
    HospitalAvailability,
    BedAvailabilityUpdateRequest,
    DoctorAlertRequest,
    DoctorAlertRecord,
    RiskPredictionRequest,
    RiskPredictionResponse,
    NearbyHospitalRequest,
    NearbyHospitalResponse,
    ChatRequest,
    ChatResponse,
    EmergencyDashboardResponse,
    SosStreamResponse,
    EmergencyOverviewResponse,
)
from app.services.ai_service import analyze_incident_multimodal, analyze_symptoms, predict_risk, generate_chat_response
from app.services.allocation import allocate_resources, assign_nearest_ambulance, DEFAULT_HOSPITALS, DEFAULT_AMBULANCES, get_nearby_hospitals
from app.services.sos_dispatch import process_voice_sos
import uuid
import base64
import json
import os
import copy
import time

router = APIRouter()

DB_FILE = "civic_db.json"

DEFAULT_DB = {
    "incidents": {},
    "patients": [],
    "symptom_checks": [],
    "doctor_alerts": [],
    "risk_predictions": [],
    "chat_history": [],
    "hospitals": copy.deepcopy(DEFAULT_HOSPITALS),
    "ambulances": copy.deepcopy(DEFAULT_AMBULANCES),
}

def normalize_db(raw):
    if not raw:
        raw = {}

    # Backward compatibility: older format stored incidents at top-level
    if "incidents" not in raw and raw:
        raw = {"incidents": raw}

    merged = {**DEFAULT_DB, **raw}
    if not merged.get("hospitals"):
        merged["hospitals"] = copy.deepcopy(DEFAULT_HOSPITALS)
    if not merged.get("ambulances"):
        merged["ambulances"] = copy.deepcopy(DEFAULT_AMBULANCES)
    return merged

def get_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            return normalize_db(json.load(f))
    return copy.deepcopy(DEFAULT_DB)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.post("/incidents/report", response_model=IncidentResponse)
async def report_incident(request: ReportRequest, background_tasks: BackgroundTasks):
    print("Received Report Request...")
    
    # 1. Decode media if needed
    img_bytes = None
    audio_bytes = None
    try:
        if request.image_base64:
            img_bytes = base64.b64decode(request.image_base64)
        if request.audio_base64:
            audio_bytes = base64.b64decode(request.audio_base64)
    except Exception as e:
        print(f"Warning: Corrupted base64 payload. Continuing without media. Error: {e}")
    
    # 2. AI Multimodal Analysis
    analysis_result = analyze_incident_multimodal(
        text_description=request.text_description or "",
        image_bytes=img_bytes,
        audio_bytes=audio_bytes
    )
    
    incident_id = f"inc_{uuid.uuid4().hex[:8]}"
    
    db = get_db()
    incidents = db["incidents"]
    incidents[incident_id] = {
        "id": incident_id,
        "status": "ANALYZED",
        "severity": analysis_result.triage_label,
        "incident_type": analysis_result.incident_type,
        "location": request.location.dict(),
        "source": request.source or "REPORT"
    }
    
    # 3. Trigger Allocation Engine in background
    allocation_res = allocate_resources(
        incident_lat=request.location.lat,
        incident_lng=request.location.lng,
        severity_label=analysis_result.triage_label,
        required_resource=analysis_result.recommended_response_type,
        hospitals=db["hospitals"],
        ambulances=db["ambulances"]
    )
    
    # Update state
    if allocation_res.get("status") == "DISPATCHED":
        incidents[incident_id].update({
            "status": "DISPATCHED",
            "assigned_ambulance": allocation_res["ambulance"]["id"],
            "assigned_hospital": allocation_res["hospital"]["id"]
        })
        for amb in db["ambulances"]:
            if amb.get("id") == allocation_res["ambulance"]["id"]:
                amb["status"] = "BUSY"
                break
    else:
        incidents[incident_id]["status"] = "ESCALATED"
        
    save_db(db)

    return incidents[incident_id]

@router.post("/sos/voice")
async def trigger_sos_voice(request: VoiceSosRequest):
    result = process_voice_sos(
        audio_file_path="mock_audio",
        user_phone=request.user_phone,
        user_location=request.location.dict()
    )
    return result

@router.get("/incidents/active")
async def get_active_incidents():
    db = get_db()
    return list(db["incidents"].values())

@router.patch("/incidents/{incident_id}/acknowledge")
async def acknowledge_incident(incident_id: str):
    db = get_db()
    incidents = db["incidents"]
    if incident_id not in incidents:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incidents[incident_id]["status"] = "ACKNOWLEDGED"
    save_db(db)
    return {"status": "success", "incident": incidents[incident_id]}

@router.post("/incidents/{incident_id}/accept")
async def accept_incident(incident_id: str):
    db = get_db()
    incidents = db["incidents"]
    if incident_id not in incidents:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident = incidents[incident_id]
    if incident.get("assigned_ambulance"):
        incident["status"] = "DISPATCHED"
        save_db(db)
        return {"status": "success", "incident": incident}

    location = incident.get("location")
    if not location:
        raise HTTPException(status_code=400, detail="Incident missing location")

    ambulance = assign_nearest_ambulance(
        incident_lat=location.get("lat"),
        incident_lng=location.get("lng"),
        required_type="AMBULANCE_BLS",
        ambulances=db["ambulances"]
    )

    if not ambulance:
        incident["status"] = "ESCALATED"
        save_db(db)
        return {"status": "error", "incident": incident, "message": "No ambulances available"}

    incident["assigned_ambulance"] = ambulance["id"]
    incident["status"] = "DISPATCHED"
    for amb in db["ambulances"]:
        if amb.get("id") == ambulance["id"]:
            amb["status"] = "BUSY"
            break

    save_db(db)
    return {"status": "success", "incident": incident}

@router.post("/patients/register", response_model=PatientRecord)
async def register_patient(request: PatientRegisterRequest):
    db = get_db()
    patient_id = f"pat_{uuid.uuid4().hex[:8]}"
    record = {
        "id": patient_id,
        "name": request.name,
        "age": request.age,
        "gender": request.gender,
        "symptoms": request.symptoms,
        "location": request.location.dict() if request.location else None,
        "vitals": request.vitals,
        "notes": request.notes,
        "status": "REGISTERED",
        "source": request.source or "ADMIN",
        "created_at": int(time.time())
    }
    db["patients"].insert(0, record)
    save_db(db)
    return record

@router.get("/patients", response_model=List[PatientRecord])
async def get_patients():
    db = get_db()
    return db["patients"]

@router.post("/symptoms/check", response_model=SymptomCheckResponse)
async def check_symptoms(request: SymptomCheckRequest):
    db = get_db()
    result = analyze_symptoms(
        symptoms=request.symptoms,
        age=request.age,
        chronic_conditions=request.chronic_conditions
    )
    db["symptom_checks"].insert(0, {
        "id": f"sym_{uuid.uuid4().hex[:8]}",
        "created_at": int(time.time()),
        "symptoms": request.symptoms,
        **result
    })
    save_db(db)
    return result

@router.get("/beds", response_model=List[HospitalAvailability])
async def get_beds():
    db = get_db()
    return db["hospitals"]

@router.patch("/beds/{hospital_id}", response_model=HospitalAvailability)
async def update_beds(hospital_id: str, request: BedAvailabilityUpdateRequest):
    db = get_db()
    hospitals = db["hospitals"]
    for hosp in hospitals:
        if hosp["id"] == hospital_id:
            if request.beds_available is not None:
                hosp["beds_available"] = request.beds_available
            if request.icu_available is not None:
                hosp["icu_available"] = request.icu_available
            if request.oxygen_available is not None:
                hosp["oxygen_available"] = request.oxygen_available
            if request.general_available is not None:
                hosp["general_available"] = request.general_available
            save_db(db)
            return hosp
    raise HTTPException(status_code=404, detail="Hospital not found")

@router.post("/doctor-alerts", response_model=DoctorAlertRecord)
async def create_doctor_alert(request: DoctorAlertRequest):
    db = get_db()
    alert_id = f"alert_{uuid.uuid4().hex[:8]}"
    record = {
        "id": alert_id,
        "doctor_name": request.doctor_name,
        "patient_name": request.patient_name,
        "severity": request.severity,
        "message": request.message,
        "contact_phone": request.contact_phone,
        "location": request.location.dict() if request.location else None,
        "hospital_id": request.hospital_id,
        "status": "OPEN",
        "created_at": int(time.time())
    }
    db["doctor_alerts"].insert(0, record)
    save_db(db)
    return record

@router.get("/doctor-alerts", response_model=List[DoctorAlertRecord])
async def get_doctor_alerts():
    db = get_db()
    return db["doctor_alerts"]

@router.patch("/doctor-alerts/{alert_id}/acknowledge", response_model=DoctorAlertRecord)
async def acknowledge_doctor_alert(alert_id: str):
    db = get_db()
    alerts = db["doctor_alerts"]
    for alert in alerts:
        if alert["id"] == alert_id:
            alert["status"] = "ACKNOWLEDGED"
            save_db(db)
            return alert
    raise HTTPException(status_code=404, detail="Doctor alert not found")

@router.post("/risk/predict", response_model=RiskPredictionResponse)
async def risk_predict(request: RiskPredictionRequest):
    db = get_db()
    result = predict_risk(
        age=request.age,
        symptoms=request.symptoms,
        vitals=request.vitals,
        comorbidities=request.comorbidities,
        triage_level=request.triage_level
    )
    db["risk_predictions"].insert(0, {
        "id": f"risk_{uuid.uuid4().hex[:8]}",
        "created_at": int(time.time()),
        **result
    })
    save_db(db)
    return result

@router.post("/hospitals/nearby", response_model=NearbyHospitalResponse)
async def hospitals_nearby(request: NearbyHospitalRequest):
    db = get_db()
    hospitals = get_nearby_hospitals(
        incident_lat=request.location.lat,
        incident_lng=request.location.lng,
        severity=request.severity,
        hospitals=db["hospitals"],
        limit=request.limit or 5
    )
    return {"hospitals": hospitals}

@router.post("/assistant/chat", response_model=ChatResponse)
async def assistant_chat(request: ChatRequest):
    db = get_db()
    result = generate_chat_response(request.message, context=request.context)
    db["chat_history"].insert(0, {
        "id": f"chat_{uuid.uuid4().hex[:8]}",
        "created_at": int(time.time()),
        "message": request.message,
        **result
    })
    save_db(db)
    return result

@router.get("/dashboard/emergency", response_model=EmergencyDashboardResponse)
async def emergency_dashboard():
    db = get_db()
    incidents = list(db["incidents"].values())
    bed_total = sum(h.get("beds_total", 0) for h in db["hospitals"])
    bed_available = sum(h.get("beds_available", 0) for h in db["hospitals"])

    latest_incidents = sorted(incidents, key=lambda i: i.get("id", ""), reverse=True)[:5]

    return {
        "active_incidents": len(incidents),
        "registered_patients": len(db["patients"]),
        "open_doctor_alerts": len([a for a in db["doctor_alerts"] if a.get("status") == "OPEN"]),
        "bed_capacity_total": bed_total,
        "bed_capacity_available": bed_available,
        "latest_incidents": latest_incidents
    }

@router.get("/sos/stream", response_model=SosStreamResponse)
async def sos_stream():
    db = get_db()
    incidents = [i for i in db["incidents"].values() if i.get("source") == "SOS"]
    patients = [p for p in db["patients"] if p.get("source") == "SOS"]
    return {"incidents": incidents[:25], "patients": patients[:25]}

@router.get("/dashboard/overview", response_model=EmergencyOverviewResponse)
async def emergency_overview():
    db = get_db()
    incidents = list(db["incidents"].values())
    ambulances = db["ambulances"]
    available_ambulances = [a for a in ambulances if a.get("status") == "AVAILABLE"]
    acknowledged_incidents = [i for i in incidents if i.get("status") == "ACKNOWLEDGED"]
    critical_incidents = [i for i in incidents if i.get("severity") == "CRITICAL"]
    high_incidents = [i for i in incidents if i.get("severity") == "HIGH"]
    acknowledged_alerts = [a for a in db["doctor_alerts"] if a.get("status") == "ACKNOWLEDGED"]
    open_alerts = [a for a in db["doctor_alerts"] if a.get("status") == "OPEN"]

    return {
        "total_incidents": len(incidents),
        "ambulance_total": len(ambulances),
        "ambulance_available": len(available_ambulances),
        "acknowledged_incidents": len(acknowledged_incidents),
        "critical_incidents": len(critical_incidents),
        "high_incidents": len(high_incidents),
        "doctor_alerts_acknowledged": len(acknowledged_alerts),
        "doctor_alerts_open": len(open_alerts)
    }
