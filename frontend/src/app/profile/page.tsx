"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  HeartPulse,
  Shield,
  LogOut,
  Save,
  Loader2,
  ChevronLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, ROLE_ROUTES } from "@/lib/types";
import Link from "next/link";

export default function ProfilePage() {
  const { user, profile, signOutUser, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [emergencyContact, setEmergencyContact] = useState(profile?.emergencyContact || "");

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await updateProfile({ fullName, phone, emergencyContact });
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  if (!profile || !user) return null;

  const roleColorMap: Record<string, string> = {
    citizen: "rose",
    responder: "emerald",
    admin: "blue",
  };
  const rc = roleColorMap[profile.role] || "blue";

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#09090b] to-[#09090b] z-0" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href={ROLE_ROUTES[profile.role]}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden"
        >
          {/* Hero Header */}
          <div className={`relative h-32 bg-gradient-to-r ${
            rc === "rose" ? "from-rose-600/20 to-rose-500/5" :
            rc === "emerald" ? "from-emerald-600/20 to-emerald-500/5" :
            "from-blue-600/20 to-blue-500/5"
          }`}>
            <div className="absolute -bottom-10 left-8">
              <div className={`w-20 h-20 rounded-2xl border-4 border-[#09090b] flex items-center justify-center text-2xl font-bold ${
                rc === "rose" ? "bg-rose-500/20 text-rose-400" :
                rc === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
                "bg-blue-500/20 text-blue-400"
              }`}>
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="avatar" className="rounded-2xl w-full h-full object-cover" />
                ) : (
                  profile.fullName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>

          <div className="pt-14 px-8 pb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                <p className="text-zinc-400 text-sm">{user.email || user.phoneNumber}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                rc === "rose" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" :
                rc === "emerald" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                "bg-blue-500/15 text-blue-400 border-blue-500/30"
              }`}>
                {ROLE_LABELS[profile.role]}
              </span>
            </div>

            {/* Success/Error alerts */}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400">
                <CheckCircle2 size={16} /> Profile updated successfully
              </motion.div>
            )}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Profile Details / Edit Form */}
            {!editing ? (
              <div className="space-y-4">
                <ProfileRow icon={<User size={16} />} label="Full Name" value={profile.fullName} />
                <ProfileRow icon={<Mail size={16} />} label="Email" value={user.email || "Not set"} />
                <ProfileRow icon={<Phone size={16} />} label="Phone" value={profile.phone || "Not set"} />
                <ProfileRow icon={<Shield size={16} />} label="Role" value={ROLE_LABELS[profile.role]} />
                <ProfileRow icon={<MapPin size={16} />} label="Location" value={profile.locationEnabled ? "Enabled" : "Disabled"} />
                <ProfileRow icon={<HeartPulse size={16} />} label="Emergency Contact" value={profile.emergencyContact || "Not set"} />
                <ProfileRow icon={<CheckCircle2 size={16} />} label="Account Status" value={profile.approved ? "Approved" : "Pending Approval"} />

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={signOutUser}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-zinc-700 text-white font-semibold px-6 p-3 rounded-xl transition-all"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Emergency Contact</label>
                  <input type="tel" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setFullName(profile.fullName); setPhone(profile.phone); setEmergencyContact(profile.emergencyContact); }}
                    className="px-6 bg-white/5 hover:bg-white/10 border border-zinc-700 text-white font-semibold p-3 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
      <div className="flex items-center gap-3 text-zinc-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}
