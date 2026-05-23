"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Map,
  Siren,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Database,
  BrainCircuit,
  Users,
  UserCheck,
  UserX,
  Loader2,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db as getDb } from "@/lib/firebase";
import { UserProfile, ROLE_LABELS } from "@/lib/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DeepAdminDashboard />
    </ProtectedRoute>
  );
}

function DeepAdminDashboard() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const { signOutUser, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("alerts");
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/incidents/active`);
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
        }
      } catch (e) {
        console.error("Live DB feed disconnected", e);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-20 md:w-64 glass-panel border-r border-zinc-800 flex flex-col z-20"
      >
        <div className="p-4 md:p-6 flex justify-center md:justify-start items-center gap-3 border-b border-zinc-800">
          <div className="bg-rose-600 p-2 rounded-xl">
            <Activity size={24} className="text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">CivicResQ</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-bold">State Command</p>
          </div>
        </div>

        <nav className="flex-1 p-3 md:p-4 flex flex-col gap-2">
          <NavItem icon={<Map size={20} />} label="Live Radar" active={activeTab === "map"} onClick={() => setActiveTab("map")} />
          <NavItem icon={<AlertTriangle size={20} />} label="Severity Matrix" active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")} />
          <NavItem icon={<Users size={20} />} label="User Management" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
          <NavItem icon={<ShieldCheck size={20} />} label="Fraud & Identity" active={activeTab === "fraud"} onClick={() => setActiveTab("fraud")} />
          <NavItem icon={<Database size={20} />} label="Resource DB" active={activeTab === "db"} onClick={() => setActiveTab("db")} />
          <Link
            href="/admin/emergency"
            className="flex items-center gap-3 px-3 py-3 md:px-4 rounded-2xl transition-all duration-200 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
          >
            <Siren size={20} />
            <span className="hidden md:block">Emergency Dashboard</span>
          </Link>
          <Link
            href="/admin/emergency-overview"
            className="flex items-center gap-3 px-3 py-3 md:px-4 rounded-2xl transition-all duration-200 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
          >
            <Activity size={20} />
            <span className="hidden md:block">Emergency Overview</span>
          </Link>
        </nav>

        {/* Bottom user menu */}
        <div className="p-3 md:p-4 border-t border-zinc-800">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800/50 transition-colors mb-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 text-xs font-bold">
              {profile?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <span className="text-sm text-zinc-300 hidden md:block truncate">{profile?.fullName || "Admin"}</span>
          </Link>
          <button
            onClick={signOutUser}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all w-full"
          >
            <LogOut size={18} />
            <span className="text-sm hidden md:block">Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Complex View */}
      <main className="flex-1 relative flex flex-col z-10 overflow-hidden">
        
        {/* Top Header - Massive Stat bar */}
        <header className="h-16 glass-panel border-b border-zinc-800 flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex gap-8">
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Incidents</span>
              <span className="font-bold text-lg text-rose-500 animate-pulse">24</span>
            </div>
            <div className="hidden md:flex flex-col border-l border-zinc-800 pl-8">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Avg Response Code</span>
              <span className="font-bold text-lg text-white">4m 12s <TrendingUp size={14} className="inline text-emerald-500"/></span>
            </div>
          </div>
          <h2 className="font-black text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-widest hidden md:block">
            Emergency Triage Protocol: ACTIVE
          </h2>
        </header>

        {/* Content Modules */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col md:flex-row gap-4">
          
          <div className="flex-1 flex gap-4 overflow-hidden w-full h-full">
            {activeTab === "alerts" && (
              <>
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  {/* Emergency Alert Severity Flow */}
                  <div className="h-2/3 glass-panel rounded-[2rem] border border-zinc-800 flex flex-col p-6">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                      <AlertTriangle size={22} className="text-amber-400"/> Triaged Emergency Flow
                    </h3>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* LOW */}
                      <div className="flex flex-col bg-zinc-900/40 rounded-2xl border border-zinc-800 p-4">
                        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
                          <span className="font-bold text-blue-400">LOW PRIORITY</span>
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">{incidents.filter(i => i.severity === 'LOW').length} Alerts</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                          {incidents.filter(i => i.severity === 'LOW').length === 0 && <p className="text-zinc-600 text-xs text-center py-4">No active low priority calls.</p>}
                          {incidents.filter(i => i.severity === 'LOW').map(inc => (
                            <div key={inc.id} className="p-3 bg-zinc-950 rounded-xl border border-blue-900/30 shadow">
                              <p className="text-white font-semibold text-sm capitalize">{inc.incident_type.replace('_', ' ')}</p>
                              <p className="text-zinc-500 text-xs mt-1">ID: {inc.id} • {inc.status}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* MEDIUM */}
                      <div className="flex flex-col bg-zinc-900/40 rounded-2xl border border-zinc-800 p-4">
                        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
                          <span className="font-bold text-amber-400">MEDIUM PRIORITY</span>
                          <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-bold">{incidents.filter(i => i.severity === 'MEDIUM').length} Alerts</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                          {incidents.filter(i => i.severity === 'MEDIUM').length === 0 && <p className="text-zinc-600 text-xs text-center py-4">No active medium priority calls.</p>}
                          {incidents.filter(i => i.severity === 'MEDIUM').map(inc => (
                            <div key={inc.id} className="p-3 bg-zinc-950 rounded-xl border border-amber-900/30 shadow">
                              <p className="text-white font-semibold text-sm capitalize">{inc.incident_type.replace('_', ' ')}</p>
                              <p className="text-zinc-500 text-xs mt-1">ID: {inc.id} • {inc.status}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* CRITICAL */}
                      <div className="flex flex-col bg-rose-950/20 rounded-2xl border border-rose-900/50 p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse"></div>
                        <div className="flex justify-between items-center mb-4 border-b border-rose-900/50 pb-3">
                          <span className="font-bold text-rose-500 flex items-center gap-1"><Siren size={16}/> CRITICAL</span>
                          <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-xs font-bold shadow-[0_0_10px_rgba(225,29,72,0.5)]">{incidents.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity)).length} Alerts</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                          {incidents.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity)).length === 0 && <p className="text-zinc-600 text-xs text-center py-4">No critical calls detected.</p>}
                          {incidents.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity)).map(inc => (
                            <div key={inc.id} className="p-3 bg-rose-900/20 rounded-xl border border-rose-500/40 shadow shadow-rose-900/20">
                              <p className="text-white font-bold text-sm capitalize">{inc.incident_type.replace('_', ' ')}</p>
                              <p className="text-rose-400 text-xs mt-1">ID: {inc.id} • {inc.assigned_ambulance ? `Dispatching ${inc.assigned_ambulance}` : 'Pending Dispatch'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Live Logs / Heatmap preview */}
                  <div className="h-1/3 flex gap-4">
                    <div className="flex-1 glass-panel rounded-[2rem] border border-zinc-800 p-6 flex flex-col">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Map size={18}/> Density Heatmap</h3>
                        <div className="flex-1 bg-[url('https://transparenttextures.com/patterns/black-mamba.png')] bg-zinc-900 rounded-xl relative border border-zinc-800 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 via-transparent to-purple-500/10 blur-xl"></div>
                        </div>
                    </div>
                    {/* Event Stream */}
                    <div className="flex-1 glass-panel rounded-[2rem] border border-zinc-800 p-5 overflow-y-auto">
                        <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2"><Activity size={16}/> System Stream</h3>
                        <div className="space-y-3 font-mono text-xs">
                          <p className="text-zinc-400"><span className="text-rose-400">[17:28:01]</span> <span className="text-white">ALERT</span> Incident created.</p>
                          <p className="text-zinc-400"><span className="text-emerald-400">[17:28:44]</span> <span className="text-white">STATUS</span> ALS-9 en route.</p>
                        </div>
                    </div>
                  </div>
                </div>
                {/* Right column - Fraud */}
                <div className="w-full md:w-80 glass-panel rounded-[2rem] border border-zinc-800 flex flex-col p-5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm"><ShieldCheck size={18} className="text-amber-500"/> Trust & Identify</h3>
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-amber-900/30 mb-6">
                    <p className="text-zinc-400 text-xs mb-3">AI evaluates caller audio patterns to assign a Trust Score.</p>
                  </div>
                  <h3 className="font-bold text-white mb-4 text-sm mt-auto">Manual Override</h3>
                  <button className="w-full bg-rose-900/30 text-rose-500 p-3 rounded-lg font-bold text-xs uppercase shadow">Force Re-route</button>
                </div>
              </>
            )}

            {activeTab === "map" && (
              <div className="flex-1 glass-panel rounded-[2rem] border border-zinc-800 p-0 flex flex-col items-center justify-center overflow-hidden relative bg-zinc-900">
                <iframe
                  width="100%"
                  height="100%"
                  className="w-full h-full absolute inset-0 rounded-[2rem] opacity-80"
                  style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                  loading="lazy"
                  allowFullScreen
                  src="https://www.openstreetmap.org/export/embed.html?bbox=72.77%2C18.97%2C72.97%2C19.17&amp;layer=mapnik&amp;marker=19.0760%2C72.8777"
                ></iframe>
              </div>
            )}

            {activeTab === "users" && <UserManagementPanel />}

            {activeTab === "fraud" && (
              <div className="flex-1 glass-panel rounded-[2rem] border border-amber-900/50 p-6 flex flex-col">
                <h3 className="text-2xl font-bold text-amber-500 mb-4 flex items-center gap-2"><ShieldCheck size={24}/> Fraud Detection Radar</h3>
                <div className="flex-1 bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 font-mono text-sm text-zinc-400">
                  Initializing telecom blacklist sync...
                </div>
              </div>
            )}

            {activeTab === "db" && (
              <div className="flex-1 glass-panel rounded-[2rem] border border-blue-900/50 p-6 flex flex-col">
                <h3 className="text-2xl font-bold text-blue-500 mb-4 flex items-center gap-2"><Database size={24}/> Database Metrics</h3>
                <div className="flex-1 bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                  <p className="text-zinc-400 font-mono">SQLite / Firebase connection active.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

/* -------- User Management Panel (Admin Approval) -------- */
function UserManagementPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(getDb(), "users"));
      const allUsers: UserProfile[] = [];
      snapshot.forEach((d) => allUsers.push(d.data() as UserProfile));
      setUsers(allUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleApproval(uid: string, approve: boolean) {
    setActionLoading(uid);
    try {
      await updateDoc(doc(getDb(), "users", uid), { approved: approve });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, approved: approve } : u))
      );
    } catch (err) {
      console.error("Failed to update approval:", err);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (filter === "pending") return u.role === "responder" && !u.approved;
    if (filter === "approved") return u.approved;
    return true;
  });

  const pendingCount = users.filter(
    (u) => u.role === "responder" && !u.approved
  ).length;

  return (
    <div className="flex-1 glass-panel rounded-[2rem] border border-zinc-800 p-6 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Users size={22} />
          User Management
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-2 animate-pulse">
              {pendingCount} pending
            </span>
          )}
        </h3>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === f
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Users size={48} className="text-zinc-700 mb-4" />
          <p className="text-zinc-500 text-sm">No users found.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {filteredUsers.map((u) => (
            <motion.div
              key={u.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                u.role === "responder" && !u.approved
                  ? "bg-amber-950/20 border-amber-500/30"
                  : "bg-zinc-900/50 border-zinc-800"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    u.role === "citizen"
                      ? "bg-rose-500/20 text-rose-400"
                      : u.role === "responder"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {u.fullName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-zinc-500 text-xs">
                      {u.email || u.phone}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        u.role === "citizen"
                          ? "bg-rose-500/15 text-rose-400"
                          : u.role === "responder"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {u.role === "responder" && !u.approved ? (
                  <>
                    <button
                      onClick={() => toggleApproval(u.uid, true)}
                      disabled={actionLoading === u.uid}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 hover:bg-emerald-600/30 transition-all disabled:opacity-50"
                    >
                      {actionLoading === u.uid ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <UserCheck size={14} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => toggleApproval(u.uid, false)}
                      disabled={actionLoading === u.uid}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30 hover:bg-rose-600/30 transition-all disabled:opacity-50"
                    >
                      <UserX size={14} />
                      Deny
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      u.approved
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {u.approved ? "Active" : "Pending"}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 md:px-4 rounded-2xl transition-all duration-200 text-sm font-medium ${
        active 
          ? 'bg-rose-600/10 text-white border border-rose-500/20 shadow-[0_0_20px_-5px_rgba(225,29,72,0.3)]' 
          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
      {active && <span className="md:hidden absolute right-2 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>}
    </button>
  )
}
