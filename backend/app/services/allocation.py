from typing import Dict, List, Optional
from math import radians, cos, sin, asin, sqrt

# Mock database structures for demonstration
DEFAULT_AMBULANCES = [
    {"id": "amb_1", "status": "AVAILABLE", "lat": 19.060, "lng": 72.855, "type": "AMBULANCE_BLS"},
    {"id": "amb_2", "status": "AVAILABLE", "lat": 19.080, "lng": 72.870, "type": "AMBULANCE_ALS"}
]

DEFAULT_HOSPITALS = [
    {
        "id": "hosp_1",
        "name": "City Trauma Center",
        "lat": 19.051,
        "lng": 72.825,
        "beds_total": 24,
        "beds_available": 8,
        "icu_available": 4,
        "oxygen_available": 10,
        "general_available": 10,
        "has_trauma_unit": True
    },
    {
        "id": "hosp_2",
        "name": "General Clinic",
        "lat": 19.075,
        "lng": 72.880,
        "beds_total": 30,
        "beds_available": 6,
        "icu_available": 1,
        "oxygen_available": 8,
        "general_available": 21,
        "has_trauma_unit": False
    }
]

def haversine(lon1, lat1, lon2, lat2):
    """Calculate the great circle distance in kilometers between two points on the earth."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def determine_best_hospital(incident_lat: float, incident_lng: float, severity: str, hospitals: Optional[List[Dict]] = None) -> Optional[Dict]:
    """
    4. Smart Resource Allocation Engine (Hospital selection)
    Finds the closest hospital with available beds and correct capability.
    """
    hospitals = hospitals or DEFAULT_HOSPITALS
    best_hospital = None
    min_distance = float('inf')
    
    for hosp in hospitals:
        beds_available = hosp.get("beds_available", hosp.get("beds", 0))
        if beds_available <= 0:
            continue
            
        # If severity is critical, must have trauma unit
        if severity == "CRITICAL" and not hosp.get("has_trauma_unit", False):
            continue
            
        dist = haversine(incident_lng, incident_lat, hosp["lng"], hosp["lat"])
        
        # Real-world: Check ETA via Google Maps Distance Matrix API here instead of straight-line distance
        # response = requests.get(f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={incident_lat},{incident_lng}&destinations={hosp['lat']},{hosp['lng']}&key=API_KEY")
        
        if dist < min_distance:
            min_distance = dist
            best_hospital = hosp
            
    return best_hospital

def assign_nearest_ambulance(incident_lat: float, incident_lng: float, required_type: str, ambulances: Optional[List[Dict]] = None) -> Optional[Dict]:
    """
    3. Real-time Map and Routing Layer (Ambulance allocation)
    Finds the nearest available appropriate ambulance.
    """
    ambulances = ambulances or DEFAULT_AMBULANCES
    best_ambulance = None
    min_distance = float('inf')
    
    for amb in ambulances:
        if amb["status"] != "AVAILABLE":
            continue
            
        if required_type == "AMBULANCE_ALS" and amb["type"] != "AMBULANCE_ALS":
            # Advanced Life Support required but only BLS available
            continue
            
        dist = haversine(incident_lng, incident_lat, amb["lng"], amb["lat"])
        
        if dist < min_distance:
            min_distance = dist
            best_ambulance = amb
            
    return best_ambulance

def allocate_resources(incident_lat: float, incident_lng: float, severity_label: str, required_resource: str, hospitals: Optional[List[Dict]] = None, ambulances: Optional[List[Dict]] = None):
    """Master assignment controller"""
    print(f"Allocating resources for incident at ({incident_lat}, {incident_lng}) with severity {severity_label}")
    
    hospital = determine_best_hospital(incident_lat, incident_lng, severity_label, hospitals=hospitals)
    ambulance = assign_nearest_ambulance(incident_lat, incident_lng, required_resource, ambulances=ambulances)
    
    if hospital and ambulance:
        print(f"✅ Route Assigned: Ambulance {ambulance['id']} -> Incident -> Hospital {hospital['name']}")
        return {"ambulance": ambulance, "hospital": hospital, "status": "DISPATCHED"}
    else:
        print("❌ Escalation triggered: Resources unavailable!")
        return {"error": "Insufficient resources. Escalating to state disaster network.", "status": "ESCALATED"}

if __name__ == "__main__":
    allocate_resources(19.076, 72.877, "CRITICAL", "AMBULANCE_ALS")

def get_nearby_hospitals(incident_lat: float, incident_lng: float, severity: Optional[str] = None, hospitals: Optional[List[Dict]] = None, limit: int = 5) -> List[Dict]:
    hospitals = hospitals or DEFAULT_HOSPITALS
    ranked: List[Dict] = []

    for hosp in hospitals:
        beds_available = hosp.get("beds_available", hosp.get("beds", 0))
        if beds_available <= 0:
            continue
        if severity == "CRITICAL" and not hosp.get("has_trauma_unit", False):
            continue
        distance = haversine(incident_lng, incident_lat, hosp["lng"], hosp["lat"])
        ranked.append({**hosp, "distance_km": round(distance, 2)})

    ranked.sort(key=lambda h: h["distance_km"])
    return ranked[:limit]
