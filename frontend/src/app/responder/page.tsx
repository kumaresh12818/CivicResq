"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, MapPin, Search, Check, X, ShieldAlert, Navigation2, BedDouble, Wind, Box, LogOut } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useAuth } from "@/context/AuthContext";

export default function ResponderPage() {
  return (
    <ProtectedRoute allowedRoles={["responder"]}>
      <ResponderApp />
    </ProtectedRoute>
  );
}

function ResponderApp() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const { signOutUser } = useAuth();
  const [role, setRole] = useState<"ambulance" | "hospital">("ambulance");
  const [responderLocation, setResponderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocError("Geolocation not available");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setResponderLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocError(null);
      },
      (error) => {
        setLocError(error.message || "Location permission denied");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:p-8">
      {/* Header Selector */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Responder Network <span className="text-sm font-semibold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md">LIVE</span>
          </h1>
          <p className="text-zinc-400">Manage real-time dispatch and resource allocation.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button 
              onClick={() => setRole("ambulance")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${role === "ambulance" ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Ambulance
            </button>
            <button 
              onClick={() => setRole("hospital")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${role === "hospital" ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Hospital
            </button>
          </div>
          <button 
            onClick={() => signOutUser()}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg hover:border-zinc-700"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {role === "ambulance" && (
            <motion.div key="amb" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <AmbulanceDashboard apiBase={apiBase} responderLocation={responderLocation} locError={locError} />
            </motion.div>
          )}
          {role === "hospital" && (
            <motion.div key="hosp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <HospitalDashboard apiBase={apiBase} responderLocation={responderLocation} locError={locError} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AmbulanceDashboard({ apiBase, responderLocation, locError }: { apiBase: string; responderLocation: { lat: number; lng: number } | null; locError: string | null }) {
  const [incidents, setIncidents] = useState<any[]>([]);
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/incidents/active`);
        if (res.ok) setIncidents(await res.json());
      } catch (e) {}
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeDispatch = incidents.find(i => ['DISPATCHED', 'ANALYZED'].includes(i.status) && ['CRITICAL', 'HIGH'].includes(i.severity));
  const pendingRequests = incidents.filter(i => i.status === 'ANALYZED' && !['CRITICAL', 'HIGH'].includes(i.severity));

  const handleAcceptDispatch = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/incidents/${id}/accept`, { method: "POST" });
      if (res.ok) {
        const payload = await res.json();
        const updated = payload.incident || payload;
        setIncidents(incidents.map(inc => inc.id === id ? { ...inc, ...updated } : inc));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const buildMapSrc = (lat: number, lng: number) => {
    const delta = 0.01;
    const left = lng - delta;
    const right = lng + delta;
    const bottom = lat - delta;
    const top = lat + delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-blue-500/30 bg-blue-950/10">
        {activeDispatch ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1"><span className="text-blue-400">ALS-UNIT</span> Active Dispatch</h2>
                <p className="text-zinc-400 text-sm">Target: {activeDispatch.incident_type.replace('_', ' ')} (ID: {activeDispatch.id})</p>
              </div>
              <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 animate-pulse">
                {activeDispatch.status}
              </div>
            </div>
            <div className="w-full h-64 bg-zinc-900 rounded-2xl mb-6 relative overflow-hidden border border-zinc-800 flex flex-col items-center justify-center pointer-events-none">
              <iframe
                width="100%"
                height="100%"
                className="absolute inset-0 scale-110 opacity-80"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                loading="lazy"
                src={buildMapSrc(activeDispatch.location.lat, activeDispatch.location.lng)}
              ></iframe>
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-zinc-300 backdrop-blur z-10 pointer-events-none">Incident: {activeDispatch.location.lat.toFixed(4)}, {activeDispatch.location.lng.toFixed(4)}</div>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 mb-6">
              <h3 className="text-sm font-bold text-zinc-300 mb-2 flex items-center gap-2"><MapPin size={16} className="text-emerald-400"/> Responder Location</h3>
              {responderLocation ? (
                <div className="w-full h-40 bg-zinc-900 rounded-xl relative overflow-hidden border border-zinc-800">
                  <iframe
                    width="100%"
                    height="100%"
                    className="absolute inset-0 opacity-80"
                    style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                    loading="lazy"
                    src={buildMapSrc(responderLocation.lat, responderLocation.lng)}
                  ></iframe>
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-zinc-300 backdrop-blur">You: {responderLocation.lat.toFixed(4)}, {responderLocation.lng.toFixed(4)}</div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">{locError || "Waiting for live location..."}</p>
              )}
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-6">
              <h3 className="text-sm font-bold text-zinc-300 mb-2 flex items-center gap-2"><ShieldAlert size={16} className="text-blue-400"/> AI Patient Preview</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">AI flagged this case as {activeDispatch.severity}. Recommended response ensures correct trauma handling parameters.</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded border border-rose-500/20">{activeDispatch.severity} Trauma</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20">
            <Check size={48} className="text-emerald-500 mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-zinc-500">No active dispatches</h2>
            <p className="text-zinc-600">Ambulance unit standing by.</p>
          </div>
        )}
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-4">Pending Requests <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded ml-2">{pendingRequests.length} Waiting</span></h2>
        <div className="space-y-4">
          {pendingRequests.length === 0 && <p className="text-sm text-zinc-600 italic">Queue clear.</p>}
          {pendingRequests.map(inc => (
             <div key={inc.id} className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold bg-amber-500/20 text-amber-500 px-2 py-1 rounded">{inc.severity}</span>
              </div>
              <h3 className="font-semibold text-white capitalize">{inc.incident_type.replace('_', ' ')}</h3>
              <p className="text-xs text-zinc-400 mb-4">ID: {inc.id}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAcceptDispatch(inc.id)}
                  className="flex-1 bg-blue-600/20 text-blue-500 py-2 rounded-lg font-semibold text-sm border border-blue-500/30 hover:bg-blue-600/30"
                >
                  Accept & Dispatch
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HospitalDashboard({ apiBase, responderLocation, locError }: { apiBase: string; responderLocation: { lat: number; lng: number } | null; locError: string | null }) {
  const [incidents, setIncidents] = useState<any[]>([]);
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/incidents/active`);
        if (res.ok) setIncidents(await res.json());
      } catch (e) {}
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 2000);
    return () => clearInterval(interval);
  }, []);

  const incomingCriticals = incidents.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity) && i.status !== 'ACKNOWLEDGED');

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/incidents/${id}/acknowledge`, { method: "PATCH" });
      if (res.ok) {
        setIncidents(incidents.filter(inc => inc.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Live Bed Management */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20">
          <h2 className="font-bold text-white mb-4">Live Bed Capactity</h2>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-300"><BedDouble size={16} className="text-emerald-500"/> ICU / Trauma</span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 rounded">{4 + incomingCriticals.length} / 12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-300"><Wind size={16} className="text-blue-500"/> Oxygen Beds</span>
              <span className="text-blue-400 bg-blue-500/10 px-2 rounded">15 / 45</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-300"><Box size={16} className="text-zinc-500"/> General Ward</span>
              <span className="text-zinc-400 bg-zinc-800 px-2 rounded">124 / 200</span>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800">
          <h2 className="font-bold text-white mb-4">Responder Location</h2>
          {responderLocation ? (
            <div className="w-full h-40 bg-zinc-900 rounded-xl relative overflow-hidden border border-zinc-800">
              <iframe
                width="100%"
                height="100%"
                className="absolute inset-0 opacity-80"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${responderLocation.lng - 0.01}%2C${responderLocation.lat - 0.01}%2C${responderLocation.lng + 0.01}%2C${responderLocation.lat + 0.01}&layer=mapnik&marker=${responderLocation.lat}%2C${responderLocation.lng}`}
              ></iframe>
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-zinc-300 backdrop-blur">You: {responderLocation.lat.toFixed(4)}, {responderLocation.lng.toFixed(4)}</div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">{locError || "Waiting for live location..."}</p>
          )}
        </div>
      </div>

      {/* Incoming Triage AI Stream */}
      <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-zinc-800">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-white">Inbound Triage Patients</h2>
          <span className="text-xs text-zinc-500"><span className="w-2 h-2 rounded-full inline-block bg-emerald-500 mr-2 animate-pulse"/>Live Feed</span>
        </div>

        <div className="space-y-4">
          {incomingCriticals.length === 0 && <p className="text-zinc-500 text-sm text-center py-10">No incoming criticals routed to this facility.</p>}
          {incomingCriticals.map(inc => (
            <div key={inc.id} className="bg-zinc-900/60 p-5 rounded-2xl border border-rose-500/30 flex flex-col md:flex-row gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-rose-500 text-white font-bold text-xs px-2 py-0.5 rounded">{inc.severity}</span>
                  <span className="text-zinc-400 text-sm font-medium">Tracking ID: {inc.id}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 capitalize">{inc.incident_type.replace('_', ' ')}</h3>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">Patient incoming. Prepare resources accordingly based on AI severity classification and vitals transmitted en route.</p>
                <div className="flex gap-2">
                  <span className="text-xs border border-blue-500/40 text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Prepare OT</span>
                </div>
              </div>
              <div className="flex flex-col justify-center min-w-[140px] gap-2">
                <button 
                  onClick={() => handleAcknowledge(inc.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-3 rounded-xl shadow-lg transition-all text-center focus:ring-4 ring-emerald-500/30"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
