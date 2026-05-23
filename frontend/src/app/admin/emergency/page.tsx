"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Space_Grotesk } from "next/font/google";
import { AlertTriangle, BedDouble, BrainCircuit, Hospital, MessageCircle, ShieldAlert, Stethoscope, Thermometer, UserPlus, MapPin, Activity, Send, RefreshCcw, Siren } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

const space = Space_Grotesk({ subsets: ["latin"] });

type Location = { lat: number; lng: number };

type HospitalAvailability = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  beds_available: number;
  beds_total: number;
  icu_available: number;
  oxygen_available: number;
  general_available: number;
  distance_km?: number;
};

type DoctorAlert = {
  id: string;
  doctor_name: string;
  patient_name: string;
  severity: string;
  message: string;
  contact_phone?: string | null;
  status: string;
  created_at: number;
};

type DashboardSummary = {
  active_incidents: number;
  registered_patients: number;
  open_doctor_alerts: number;
  bed_capacity_total: number;
  bed_capacity_available: number;
  latest_incidents: Array<{ id: string; severity: string; incident_type: string; status: string }>;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type SosStream = {
  incidents: Array<{ id: string; severity: string; incident_type: string; status: string; location?: Location }>;
  patients: Array<{ id: string; name: string; age?: number; symptoms?: string[]; created_at?: number }>;
};

export default function EmergencyDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <EmergencyDashboard />
    </ProtectedRoute>
  );
}

function EmergencyDashboard() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [hospitals, setHospitals] = useState<HospitalAvailability[]>([]);
  const [nearby, setNearby] = useState<HospitalAvailability[]>([]);
  const [alerts, setAlerts] = useState<DoctorAlert[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sosStream, setSosStream] = useState<SosStream>({ incidents: [], patients: [] });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    age: "",
    gender: "",
    symptoms: "",
    lat: "",
    lng: "",
    notes: "",
    source: false,
  });

  const [symptomForm, setSymptomForm] = useState({
    symptoms: "",
    age: "",
    chronic: "",
  });
  const [symptomResult, setSymptomResult] = useState<null | {
    triage_level: string;
    possible_conditions: string[];
    advice: string[];
    confidence: number;
  }>(null);

  const [riskForm, setRiskForm] = useState({
    age: "",
    symptoms: "",
    comorbidities: "",
    heartRate: "",
    spo2: "",
    systolic: "",
    triage: "",
  });
  const [riskResult, setRiskResult] = useState<null | {
    risk_score: number;
    risk_level: string;
    factors: string[];
    recommendation: string;
  }>(null);

  const [alertForm, setAlertForm] = useState({
    doctor_name: "",
    patient_name: "",
    severity: "",
    message: "",
    contact_phone: "",
  });

  const [nearbyForm, setNearbyForm] = useState({
    lat: "",
    lng: "",
    severity: "",
  });

  const [chatInput, setChatInput] = useState("");

  const refreshAll = async () => {
    await Promise.all([refreshDashboard(), refreshHospitals(), refreshAlerts(), refreshSosStream()]);
  };

  const refreshDashboard = async () => {
    const res = await fetch(`${apiBase}/api/v1/dashboard/emergency`);
    if (res.ok) setDashboard(await res.json());
  };

  const refreshHospitals = async () => {
    const res = await fetch(`${apiBase}/api/v1/beds`);
    if (res.ok) setHospitals(await res.json());
  };

  const refreshAlerts = async () => {
    const res = await fetch(`${apiBase}/api/v1/doctor-alerts`);
    if (res.ok) setAlerts(await res.json());
  };

  const refreshSosStream = async () => {
    const res = await fetch(`${apiBase}/api/v1/sos/stream`);
    if (res.ok) setSosStream(await res.json());
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const bedSummary = useMemo(() => {
    const total = hospitals.reduce((sum, h) => sum + (h.beds_total || 0), 0);
    const available = hospitals.reduce((sum, h) => sum + (h.beds_available || 0), 0);
    return { total, available };
  }, [hospitals]);

  const handleRegisterPatient = async () => {
    const payload = {
      name: registerForm.name,
      age: registerForm.age ? Number(registerForm.age) : undefined,
      gender: registerForm.gender || undefined,
      symptoms: registerForm.symptoms.split(",").map(s => s.trim()).filter(Boolean),
      location: registerForm.lat && registerForm.lng ? { lat: Number(registerForm.lat), lng: Number(registerForm.lng) } : undefined,
      notes: registerForm.notes || undefined,
      source: registerForm.source ? "SOS" : undefined,
    };
    const res = await fetch(`${apiBase}/api/v1/patients/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setRegisterForm({ name: "", age: "", gender: "", symptoms: "", lat: "", lng: "", notes: "", source: false });
      refreshDashboard();
      refreshSosStream();
    }
  };

  const handleSymptomCheck = async () => {
    const payload = {
      symptoms: symptomForm.symptoms.split(",").map(s => s.trim()).filter(Boolean),
      age: symptomForm.age ? Number(symptomForm.age) : undefined,
      chronic_conditions: symptomForm.chronic ? symptomForm.chronic.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };
    const res = await fetch(`${apiBase}/api/v1/symptoms/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSymptomResult(await res.json());
  };

  const handleRiskPredict = async () => {
    const payload = {
      age: riskForm.age ? Number(riskForm.age) : undefined,
      symptoms: riskForm.symptoms.split(",").map(s => s.trim()).filter(Boolean),
      comorbidities: riskForm.comorbidities ? riskForm.comorbidities.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      vitals: {
        heart_rate: riskForm.heartRate ? Number(riskForm.heartRate) : undefined,
        spo2: riskForm.spo2 ? Number(riskForm.spo2) : undefined,
        systolic: riskForm.systolic ? Number(riskForm.systolic) : undefined,
      },
      triage_level: riskForm.triage || undefined,
    };
    const res = await fetch(`${apiBase}/api/v1/risk/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setRiskResult(await res.json());
  };

  const handleAlertSubmit = async () => {
    const payload = {
      doctor_name: alertForm.doctor_name,
      patient_name: alertForm.patient_name,
      severity: alertForm.severity,
      message: alertForm.message,
      contact_phone: alertForm.contact_phone || undefined,
    };
    const res = await fetch(`${apiBase}/api/v1/doctor-alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setAlertForm({ doctor_name: "", patient_name: "", severity: "", message: "", contact_phone: "" });
      refreshAlerts();
      refreshDashboard();
    }
  };

  const handleAlertAcknowledge = async (id: string) => {
    const res = await fetch(`${apiBase}/api/v1/doctor-alerts/${id}/acknowledge`, { method: "PATCH" });
    if (res.ok) {
      refreshAlerts();
      refreshDashboard();
    }
  };

  const handleNearbySearch = async () => {
    const payload = {
      location: { lat: Number(nearbyForm.lat), lng: Number(nearbyForm.lng) },
      severity: nearbyForm.severity || undefined,
    };
    const res = await fetch(`${apiBase}/api/v1/hospitals/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setNearby(data.hospitals || []);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: "user", text: chatInput };
    setChatMessages(prev => [userMsg, ...prev]);
    setChatInput("");

    const res = await fetch(`${apiBase}/api/v1/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg.text }),
    });
    if (res.ok) {
      const data = await res.json();
      const botMsg: ChatMessage = { role: "assistant", text: data.response };
      setChatMessages(prev => [botMsg, ...prev]);
    }
  };

  const handleBedUpdate = async (id: string, values: Partial<HospitalAvailability>) => {
    const res = await fetch(`${apiBase}/api/v1/beds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) refreshHospitals();
  };

  const updateHospitalField = (id: string, field: keyof HospitalAvailability, value: string) => {
    if (!value.trim()) return;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    handleBedUpdate(id, { [field]: parsed });
  };

  return (
    <div className={`${space.className} min-h-screen bg-[#050506] text-zinc-100 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,29,72,0.15),_transparent_50%)]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full" />

      <main className="relative z-10 px-6 py-10 max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <p className="uppercase tracking-[0.4em] text-[10px] text-rose-400">Emergency Command</p>
            <h1 className="text-3xl md:text-4xl font-semibold">Emergency Operations Hub</h1>
            <p className="text-zinc-400 text-sm mt-2">Unified triage, allocation, and risk intelligence for rapid response.</p>
          </div>
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            Refresh Data
          </button>
        </motion.header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Incidents", value: dashboard?.active_incidents ?? 0, icon: AlertTriangle },
            { label: "Registered Patients", value: dashboard?.registered_patients ?? 0, icon: UserPlus },
            { label: "Open Doctor Alerts", value: dashboard?.open_doctor_alerts ?? 0, icon: Stethoscope },
            { label: "Beds Available", value: `${bedSummary.available} / ${bedSummary.total}`, icon: BedDouble },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-2 text-white">{stat.value}</p>
                </div>
                <stat.icon size={22} className="text-rose-400" />
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <UserPlus size={20} className="text-emerald-400" />
                <h2 className="text-lg font-semibold">Emergency Patient Register</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Patient name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Age" value={registerForm.age} onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Gender" value={registerForm.gender} onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Symptoms (comma separated)" value={registerForm.symptoms} onChange={(e) => setRegisterForm({ ...registerForm, symptoms: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Latitude" value={registerForm.lat} onChange={(e) => setRegisterForm({ ...registerForm, lat: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Longitude" value={registerForm.lng} onChange={(e) => setRegisterForm({ ...registerForm, lng: e.target.value })} />
                <textarea className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2 md:col-span-2" placeholder="Notes" value={registerForm.notes} onChange={(e) => setRegisterForm({ ...registerForm, notes: e.target.value })} />
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={registerForm.source}
                  onChange={(e) => setRegisterForm({ ...registerForm, source: e.target.checked })}
                  className="accent-rose-500"
                />
                Registered via SOS
              </label>
              <button onClick={handleRegisterPatient} className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm">Register Patient</button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit size={20} className="text-amber-400" />
                <h2 className="text-lg font-semibold">AI Symptom Checker</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2 md:col-span-2" placeholder="Symptoms (comma separated)" value={symptomForm.symptoms} onChange={(e) => setSymptomForm({ ...symptomForm, symptoms: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Age" value={symptomForm.age} onChange={(e) => setSymptomForm({ ...symptomForm, age: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2 md:col-span-3" placeholder="Chronic conditions" value={symptomForm.chronic} onChange={(e) => setSymptomForm({ ...symptomForm, chronic: e.target.value })} />
              </div>
              <button onClick={handleSymptomCheck} className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-sm">Run Triage</button>
              {symptomResult && (
                <div className="mt-4 bg-zinc-950/70 border border-white/10 rounded-2xl p-4 text-sm">
                  <p className="text-amber-300 font-semibold">Triage: {symptomResult.triage_level}</p>
                  <p className="text-zinc-400">Confidence: {(symptomResult.confidence * 100).toFixed(0)}%</p>
                  <p className="mt-2 text-zinc-300">Conditions: {symptomResult.possible_conditions.join(", ")}</p>
                  <ul className="mt-2 text-zinc-400 list-disc list-inside">
                    {symptomResult.advice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Thermometer size={20} className="text-rose-400" />
                <h2 className="text-lg font-semibold">Risk Prediction</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Age" value={riskForm.age} onChange={(e) => setRiskForm({ ...riskForm, age: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Triage level" value={riskForm.triage} onChange={(e) => setRiskForm({ ...riskForm, triage: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2 md:col-span-2" placeholder="Symptoms (comma separated)" value={riskForm.symptoms} onChange={(e) => setRiskForm({ ...riskForm, symptoms: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2 md:col-span-2" placeholder="Comorbidities" value={riskForm.comorbidities} onChange={(e) => setRiskForm({ ...riskForm, comorbidities: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Heart rate" value={riskForm.heartRate} onChange={(e) => setRiskForm({ ...riskForm, heartRate: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="SpO2" value={riskForm.spo2} onChange={(e) => setRiskForm({ ...riskForm, spo2: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Systolic BP" value={riskForm.systolic} onChange={(e) => setRiskForm({ ...riskForm, systolic: e.target.value })} />
              </div>
              <button onClick={handleRiskPredict} className="mt-4 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 text-sm">Predict Risk</button>
              {riskResult && (
                <div className="mt-4 bg-zinc-950/70 border border-white/10 rounded-2xl p-4 text-sm">
                  <p className="text-rose-300 font-semibold">Risk: {riskResult.risk_level} ({riskResult.risk_score})</p>
                  <p className="text-zinc-400">Factors: {riskResult.factors.join(", ") || "none"}</p>
                  <p className="text-zinc-300 mt-2">{riskResult.recommendation}</p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BedDouble size={20} className="text-emerald-400" />
                <h2 className="text-lg font-semibold">Bed Availability</h2>
              </div>
              <div className="space-y-4">
                {hospitals.map((hosp) => (
                  <div key={hosp.id} className="bg-zinc-950/60 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{hosp.name}</p>
                      <span className="text-xs text-emerald-300">{hosp.beds_available} / {hosp.beds_total}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                      <span>ICU: {hosp.icu_available}</span>
                      <span>O2: {hosp.oxygen_available}</span>
                      <span>General: {hosp.general_available}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <input
                        className="bg-zinc-900/70 border border-white/10 rounded-lg px-2 py-1 text-xs"
                        placeholder="Beds available"
                        onBlur={(e) => updateHospitalField(hosp.id, "beds_available", e.target.value)}
                      />
                      <input
                        className="bg-zinc-900/70 border border-white/10 rounded-lg px-2 py-1 text-xs"
                        placeholder="ICU available"
                        onBlur={(e) => updateHospitalField(hosp.id, "icu_available", e.target.value)}
                      />
                      <input
                        className="bg-zinc-900/70 border border-white/10 rounded-lg px-2 py-1 text-xs"
                        placeholder="O2 available"
                        onBlur={(e) => updateHospitalField(hosp.id, "oxygen_available", e.target.value)}
                      />
                      <input
                        className="bg-zinc-900/70 border border-white/10 rounded-lg px-2 py-1 text-xs"
                        placeholder="General available"
                        onBlur={(e) => updateHospitalField(hosp.id, "general_available", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert size={20} className="text-rose-400" />
                <h2 className="text-lg font-semibold">Doctor Alert System</h2>
              </div>
              <div className="space-y-3">
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Doctor name" value={alertForm.doctor_name} onChange={(e) => setAlertForm({ ...alertForm, doctor_name: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Patient name" value={alertForm.patient_name} onChange={(e) => setAlertForm({ ...alertForm, patient_name: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Severity" value={alertForm.severity} onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })} />
                <textarea className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Alert message" value={alertForm.message} onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Contact phone" value={alertForm.contact_phone} onChange={(e) => setAlertForm({ ...alertForm, contact_phone: e.target.value })} />
                <button onClick={handleAlertSubmit} className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 text-sm">Send Alert</button>
              </div>
              <div className="mt-4 space-y-2 text-xs text-zinc-400">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="bg-zinc-950/70 border border-white/10 rounded-xl p-3">
                    <p className="text-white">{alert.patient_name} - {alert.severity}</p>
                    <p className="text-zinc-500">{alert.message}</p>
                    {alert.status !== "ACKNOWLEDGED" && (
                      <button
                        onClick={() => handleAlertAcknowledge(alert.id)}
                        className="mt-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300 border border-emerald-400/30 px-2 py-1 rounded-full"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-blue-400" />
                <h2 className="text-lg font-semibold">Nearby Hospital Suggestion</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Latitude" value={nearbyForm.lat} onChange={(e) => setNearbyForm({ ...nearbyForm, lat: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Longitude" value={nearbyForm.lng} onChange={(e) => setNearbyForm({ ...nearbyForm, lng: e.target.value })} />
                <input className="bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2 md:col-span-2" placeholder="Severity (optional)" value={nearbyForm.severity} onChange={(e) => setNearbyForm({ ...nearbyForm, severity: e.target.value })} />
              </div>
              <button onClick={handleNearbySearch} className="mt-4 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm">Find Hospitals</button>
              <div className="mt-4 space-y-2">
                {nearby.map(hosp => (
                  <div key={hosp.id} className="bg-zinc-950/70 border border-white/10 rounded-xl p-3 text-sm">
                    <p className="text-white">{hosp.name}</p>
                    <p className="text-zinc-400">{hosp.distance_km} km - {hosp.beds_available} beds available</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Siren size={20} className="text-rose-400" />
                <h2 className="text-lg font-semibold">SOS Stream</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Accident & Incident SOS</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {sosStream.incidents.length === 0 && <p className="text-zinc-500">No SOS incidents yet.</p>}
                    {sosStream.incidents.map((item) => (
                      <div key={item.id} className="bg-zinc-900/70 border border-white/10 rounded-xl p-3">
                        <p className="text-white font-semibold capitalize">{item.incident_type?.replace("_", " ")}</p>
                        <p className="text-zinc-400 text-xs">{item.id} • {item.severity} • {item.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">SOS Patient Registrations</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {sosStream.patients.length === 0 && <p className="text-zinc-500">No SOS registrations yet.</p>}
                    {sosStream.patients.map((patient) => (
                      <div key={patient.id} className="bg-zinc-900/70 border border-white/10 rounded-xl p-3">
                        <p className="text-white font-semibold">{patient.name}</p>
                        <p className="text-zinc-400 text-xs">{patient.id} • {patient.age ?? "-"} yrs</p>
                        {!!patient.symptoms?.length && <p className="text-zinc-500 text-xs mt-1">{patient.symptoms.join(", ")}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={20} className="text-purple-300" />
                <h2 className="text-lg font-semibold">Chatbot Assistant</h2>
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-zinc-900/70 border border-white/10 rounded-xl px-4 py-2" placeholder="Ask for guidance" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                <button onClick={handleChatSend} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"><Send size={16} /></button>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`rounded-xl p-3 border ${msg.role === "user" ? "border-blue-500/30 bg-blue-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
                    <p className="text-zinc-200">{msg.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={20} className="text-emerald-300" />
            <h2 className="text-lg font-semibold">Emergency Dashboard Feed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(dashboard?.latest_incidents || []).map((incident) => (
              <div key={incident.id} className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-semibold capitalize">{incident.incident_type?.replace("_", " ")}</p>
                <p className="text-zinc-400 text-sm">{incident.id} - {incident.severity}</p>
                <p className="text-zinc-500 text-xs">Status: {incident.status}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
