"use client";

import { motion } from "framer-motion";
import { Clock, ShieldAlert, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PendingApprovalPage() {
  const { user, profile, signOutUser } = useAuth();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b] relative font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-[#09090b] to-[#09090b] z-0" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="glass-panel p-10 rounded-[2rem] w-full max-w-md z-10 border border-zinc-800 shadow-2xl text-center mx-4"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-lg shadow-amber-500/10">
          <Clock size={40} className="text-amber-400" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">Account Pending Approval</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Your responder account is awaiting admin verification. You&apos;ll be notified once approved.
        </p>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Name</span>
            <span className="text-white font-medium">{profile?.fullName || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Email</span>
            <span className="text-white font-medium">{user?.email || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Role</span>
            <span className="text-emerald-400 font-semibold">Field Responder</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Status</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              Pending
            </span>
          </div>
        </div>

        <button
          onClick={signOutUser}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-zinc-700 text-white font-semibold p-3 rounded-xl transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
