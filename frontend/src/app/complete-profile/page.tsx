"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  User,
  Phone,
  MapPin,
  HeartPulse,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole, ROLE_ROUTES } from "@/lib/types";
import { doc, setDoc } from "firebase/firestore";
import { db as getDb } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [role, setRole] = useState<UserRole>("citizen");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);

  async function requestLocation() {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setLocationEnabled(true);
    } catch {
      setLocationEnabled(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!fullName || !phone) {
      setError("Full name and phone number are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const profileData = {
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        fullName,
        phone,
        role,
        emergencyContact,
        locationEnabled,
        approved: role !== "responder",
        createdAt: Date.now(),
      };
      await setDoc(doc(getDb(), "users", user.uid), profileData);

      if (role === "responder") {
        router.push("/pending-approval");
      } else {
        router.push(ROLE_ROUTES[role]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  const roleOptions = [
    { value: "citizen" as UserRole, label: "Citizen", color: "rose", desc: "Report emergencies & get help" },
    { value: "responder" as UserRole, label: "Responder", color: "emerald", desc: "Respond to incidents (needs approval)" },
    { value: "admin" as UserRole, label: "Admin", color: "blue", desc: "Command center access" },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b] relative font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/15 via-[#09090b] to-[#09090b] z-0" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="glass-panel p-8 md:p-10 rounded-[2rem] w-full max-w-md z-10 border border-zinc-800 shadow-2xl mx-4"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <ShieldAlert size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Complete Your Profile</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Signed in as <span className="text-white font-medium">{user?.email || user?.phoneNumber}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Full Name *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><User size={16} /></span>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Phone Number *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Phone size={16} /></span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" placeholder="+91 9876543210" />
            </div>
          </div>

          {/* Role Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Select Your Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    role === r.value
                      ? r.color === "rose"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                        : r.color === "emerald"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-blue-500/15 border-blue-500/40 text-blue-400"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  <span className="text-xs font-bold block">{r.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-1">{roleOptions.find((r) => r.value === role)?.desc}</p>
          </div>

          {/* Location */}
          <button
            type="button"
            onClick={requestLocation}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              locationEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600"
            }`}
          >
            <MapPin size={16} />
            <span className="text-sm font-semibold">{locationEnabled ? "Location Enabled ✓" : "Enable Location Access"}</span>
          </button>

          {/* Emergency Contact */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Emergency Contact</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><HeartPulse size={16} /></span>
              <input type="tel" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" placeholder="+91 9876543210" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold p-3 rounded-xl mt-2 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
            Complete Setup
          </button>
        </form>
      </motion.div>
    </div>
  );
}
