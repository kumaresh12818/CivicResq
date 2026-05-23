"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sora } from "next/font/google";
import { Activity, Ambulance, AlertTriangle, CheckCircle2, ShieldAlert, Siren, Stethoscope, TimerReset } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

const sora = Sora({ subsets: ["latin"] });

type Overview = {
  total_incidents: number;
  ambulance_total: number;
  ambulance_available: number;
  acknowledged_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  doctor_alerts_acknowledged: number;
  doctor_alerts_open: number;
};

type Incident = {
  id: string;
  severity: string;
  incident_type: string;
  status: string;
  assigned_ambulance?: string;
};

type DoctorAlert = {
  id: string;
  doctor_name: string;
  patient_name: string;
  severity: string;
  status: string;
};

export default function EmergencyOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <EmergencyOverview />
    </ProtectedRoute>
  );
}

function EmergencyOverview() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const [overview, setOverview] = useState<Overview | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<DoctorAlert[]>([]);

  const refreshAll = async () => {
    const [overviewRes, incidentsRes, alertsRes] = await Promise.all([
      fetch(`${apiBase}/api/v1/dashboard/overview`),
      fetch(`${apiBase}/api/v1/incidents/active`),
      fetch(`${apiBase}/api/v1/doctor-alerts`),
    ]);

    if (overviewRes.ok) setOverview(await overviewRes.json());
    if (incidentsRes.ok) setIncidents(await incidentsRes.json());
    if (alertsRes.ok) setAlerts(await alertsRes.json());
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const criticalHigh = useMemo(() => incidents.filter(i => ["CRITICAL", "HIGH"].includes(i.severity)), [incidents]);
  const acknowledgedAlerts = useMemo(() => alerts.filter(a => a.status === "ACKNOWLEDGED"), [alerts]);

  return (
    <div className={`${sora.className} min-h-screen bg-[#050505] text-zinc-100 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_50%)]" />
      <div className="absolute -right-20 top-20 w-[28rem] h-[28rem] bg-rose-500/10 blur-[140px] rounded-full" />
      <div className="absolute -left-20 bottom-10 w-[26rem] h-[26rem] bg-blue-500/10 blur-[140px] rounded-full" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">Emergency Overview</p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Command Status Pulse</h1>
            <p className="text-sm text-zinc-400 mt-2">Live totals, ambulance readiness, and acknowledgement signals.</p>
          </div>
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition"
          >
            <TimerReset size={16} />
            Refresh
          </button>
        </motion.header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Incidents", value: overview?.total_incidents ?? 0, icon: Activity },
            { label: "Ambulances Ready", value: `${overview?.ambulance_available ?? 0}/${overview?.ambulance_total ?? 0}`, icon: Ambulance },
            { label: "Critical / High", value: `${overview?.critical_incidents ?? 0}/${overview?.high_incidents ?? 0}`, icon: Siren },
            { label: "Acknowledged", value: overview?.acknowledged_incidents ?? 0, icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-2 text-white">{stat.value}</p>
                </div>
                <stat.icon size={22} className="text-emerald-300" />
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl border border-white/10 p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-amber-400" />
              <h2 className="text-lg font-semibold">Critical & High Severity</h2>
            </div>
            <div className="space-y-3">
              {criticalHigh.length === 0 && <p className="text-zinc-500">No active critical/high incidents.</p>}
              {criticalHigh.slice(0, 6).map((item) => (
                <div key={item.id} className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold capitalize">{item.incident_type?.replace("_", " ")}</p>
                      <p className="text-xs text-zinc-400">{item.id} • {item.status}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full border border-rose-500/30 text-rose-300">
                      {item.severity}
                    </span>
                  </div>
                  {item.assigned_ambulance && (
                    <p className="text-xs text-zinc-500 mt-2">Unit: {item.assigned_ambulance}</p>
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
              <Stethoscope size={20} className="text-blue-300" />
              <h2 className="text-lg font-semibold">Doctor Alerts</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Acknowledged</p>
                <p className="text-2xl font-semibold mt-2 text-white">{overview?.doctor_alerts_acknowledged ?? 0}</p>
              </div>
              <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Open</p>
                <p className="text-2xl font-semibold mt-2 text-white">{overview?.doctor_alerts_open ?? 0}</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={20} className="text-rose-300" />
              <h2 className="text-lg font-semibold">Acknowledged Doctor Alerts</h2>
            </div>
            <div className="space-y-3">
              {acknowledgedAlerts.length === 0 && <p className="text-zinc-500">No alerts acknowledged yet.</p>}
              {acknowledgedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                  <p className="text-white font-semibold">Dr. {alert.doctor_name}</p>
                  <p className="text-xs text-zinc-400">Patient: {alert.patient_name} • {alert.severity}</p>
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
              <Siren size={20} className="text-amber-300" />
              <h2 className="text-lg font-semibold">Incident Status Pulse</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Acknowledged</p>
                <p className="text-2xl font-semibold mt-2 text-white">{overview?.acknowledged_incidents ?? 0}</p>
              </div>
              <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Total</p>
                <p className="text-2xl font-semibold mt-2 text-white">{overview?.total_incidents ?? 0}</p>
              </div>
              <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Critical</p>
                <p className="text-2xl font-semibold mt-2 text-white">{overview?.critical_incidents ?? 0}</p>
              </div>
              <div className="bg-zinc-950/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">High</p>
                <p className="text-2xl font-semibold mt-2 text-white">{overview?.high_incidents ?? 0}</p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
