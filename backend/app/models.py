from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class Location(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None

class ReportRequest(BaseModel):
    reporter_id: str
    location: Location
    text_description: Optional[str] = None
    image_base64: Optional[str] = None
    audio_base64: Optional[str] = None
    source: Optional[str] = None

class AssignResourceRequest(BaseModel):
    incident_id: str
    required_resource: str = "AMBULANCE_BLS"
    
class VoiceSosRequest(BaseModel):
    user_phone: str
    location: Location
    audio_base64: str

class IncidentResponse(BaseModel):
    id: str
    status: str
    severity: str
    incident_type: str
    assigned_ambulance: Optional[str] = None
    assigned_hospital: Optional[str] = None
    source: Optional[str] = None

class PatientRegisterRequest(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    symptoms: List[str] = []
    location: Optional[Location] = None
    vitals: Optional[Dict[str, float]] = None
    notes: Optional[str] = None
    source: Optional[str] = None

class PatientRecord(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    symptoms: List[str] = []
    location: Optional[Location] = None
    vitals: Optional[Dict[str, float]] = None
    notes: Optional[str] = None
    status: str = "REGISTERED"
    source: Optional[str] = None
    created_at: int

class SymptomCheckRequest(BaseModel):
    symptoms: List[str]
    age: Optional[int] = None
    chronic_conditions: Optional[List[str]] = None

class SymptomCheckResponse(BaseModel):
    triage_level: str
    possible_conditions: List[str]
    advice: List[str]
    confidence: float

class HospitalAvailability(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    beds_available: int
    beds_total: int
    icu_available: int
    oxygen_available: int
    general_available: int

class BedAvailabilityUpdateRequest(BaseModel):
    beds_available: Optional[int] = None
    icu_available: Optional[int] = None
    oxygen_available: Optional[int] = None
    general_available: Optional[int] = None

class DoctorAlertRequest(BaseModel):
    doctor_name: str
    patient_name: str
    severity: str
    message: str
    contact_phone: Optional[str] = None
    location: Optional[Location] = None
    hospital_id: Optional[str] = None

class DoctorAlertRecord(BaseModel):
    id: str
    doctor_name: str
    patient_name: str
    severity: str
    message: str
    contact_phone: Optional[str] = None
    location: Optional[Location] = None
    hospital_id: Optional[str] = None
    status: str = "OPEN"
    created_at: int

class RiskPredictionRequest(BaseModel):
    age: Optional[int] = None
    symptoms: List[str] = []
    vitals: Optional[Dict[str, float]] = None
    comorbidities: Optional[List[str]] = None
    triage_level: Optional[str] = None

class RiskPredictionResponse(BaseModel):
    risk_score: int
    risk_level: str
    factors: List[str]
    recommendation: str

class NearbyHospitalRequest(BaseModel):
    location: Location
    severity: Optional[str] = None
    limit: Optional[int] = 5

class HospitalSuggestion(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    beds_available: int
    beds_total: int
    icu_available: int
    oxygen_available: int
    general_available: int
    distance_km: float

class NearbyHospitalResponse(BaseModel):
    hospitals: List[HospitalSuggestion]

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggested_actions: List[str]

class EmergencyDashboardResponse(BaseModel):
    active_incidents: int
    registered_patients: int
    open_doctor_alerts: int
    bed_capacity_total: int
    bed_capacity_available: int
    latest_incidents: List[Dict]

class SosStreamResponse(BaseModel):
    incidents: List[Dict]
    patients: List[Dict]

class EmergencyOverviewResponse(BaseModel):
    total_incidents: int
    ambulance_total: int
    ambulance_available: int
    acknowledged_incidents: int
    critical_incidents: int
    high_incidents: int
    doctor_alerts_acknowledged: int
    doctor_alerts_open: int
