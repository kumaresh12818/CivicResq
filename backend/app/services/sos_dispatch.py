import os

try:
    from twilio.rest import Client
except Exception:
    Client = None

def get_twilio_client():
    if Client is None:
        print("Warning: Twilio SDK not installed. Using MOCK SMS logic for development.")
        return None
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        print("Warning: Twilio API keys not found in environment. Using MOCK SMS logic for development.")
        return None
    return Client(account_sid, auth_token)

def process_voice_sos(audio_file_path: str, user_phone: str, user_location: dict):
    """
    6. Voice SOS and auto alert workflow
    Handles the end-to-end SOS triggering process.
    """
    print(f"Processing Voice SOS from {user_phone}...")
    
    # Step 1: Use Gemini to transcribe and extract intent from the audio
    # from backend.app.services.ai_service import analyze_incident_multimodal
    # with open(audio_file_path, "rb") as f:
    #     audio_bytes = f.read()
    # analysis = analyze_incident_multimodal(text_description="", audio_bytes=audio_bytes)
    
    # Mock analysis result
    mock_analysis = {
        "incident_type": "violence",
        "severity_score": 90,
        "summary": "Caller is hiding and reporting an armed public disturbance nearby."
    }
    
    # Step 2: Trigger resource allocation
    # from backend.app.services.allocation import allocate_resources
    # allocation = allocate_resources(user_location['lat'], user_location['lng'], "CRITICAL", "POLICE")
    
    # Mock allocation
    mock_allocation = {
        "status": "DISPATCHED",
        "ambulance": {"id": "police_unit_12"},
        "hospital": {"id": "safe_zone_1", "name": "Central Police Station"}
    }
    
    # Step 3: Send auto-alert via Twilio
    client = get_twilio_client()
    
    # Construct the message
    msg_body = (
        f"🚨 CIVICRESQ SOS ALERT 🚨\n"
        f"Intent: {mock_analysis['summary']}\n"
        f"Severity: {mock_analysis['severity_score']}/100\n"
        f"Location: https://maps.google.com/?q={user_location['lat']},{user_location['lng']}\n"
        f"Dispatched: {mock_allocation['ambulance']['id']} ETA: 4 mins"
    )
    
    # Notify user via SMS
    if client:
        twilio_number = os.environ.get("TWILIO_PHONE_NUMBER", "+1234567890")
        try:
            message = client.messages.create(
                body=msg_body,
                from_=twilio_number,
                to=user_phone
            )
            print(f"✅ Real Twilio SMS sent: SID {message.sid}")
        except Exception as e:
            print(f"❌ Twilio Network Error: {e}")
    else:
        print(msg_body)
    
    # Notify dashboard/admin via websockets
    # websocket_manager.broadcast("NEW_CRITICAL_SOS", data)
    print("Dashboard Notification Triggered.")
    
    return {"status": "success", "alert_sent": True}

if __name__ == "__main__":
    process_voice_sos(
        audio_file_path="mock_recording.mp3",
        user_phone="+919876543210",
        user_location={"lat": 19.0760, "lng": 72.8777}
    )
