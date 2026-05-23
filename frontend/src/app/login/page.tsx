"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  User,
  MapPin,
  HeartPulse,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole, ROLE_LABELS } from "@/lib/types";
import { ConfirmationResult } from "firebase/auth";
import Link from "next/link";

type AuthMode = "login" | "signup" | "phone" | "forgot";

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Phone OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Forgot password
  const [resetEmail, setResetEmail] = useState("");

  function clearForm() {
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setRole("citizen");
    setEmergencyContact("");
    setPhoneNumber("");
    setOtpCode("");
    setConfirmationResult(null);
    setOtpSent(false);
    setResetEmail("");
  }

  function switchMode(newMode: AuthMode) {
    clearForm();
    setMode(newMode);
  }

  // Request location permission
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

  // Handle email login
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // Handle signup
  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName || !phone || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, {
        fullName,
        phone,
        role,
        emergencyContact,
        locationEnabled,
      });
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  // Handle Google login
  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  // Phone OTP Step 1
  async function handleSendOTP(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!phoneNumber) {
      setError("Please enter your phone number");
      return;
    }
    setLoading(true);
    try {
      const result = await sendPhoneOTP(phoneNumber);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // Phone OTP Step 2
  async function handleVerifyOTP(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!confirmationResult || !otpCode) return;
    setLoading(true);
    try {
      await verifyPhoneOTP(confirmationResult, otpCode);
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  // Forgot password
  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!resetEmail) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetEmail);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  const roleOptions: { value: UserRole; label: string; color: string; desc: string }[] = [
    { value: "citizen", label: "Citizen", color: "rose", desc: "Report emergencies & get help" },
    { value: "responder", label: "Responder", color: "emerald", desc: "Respond to incidents (needs approval)" },
    { value: "admin", label: "Admin", color: "blue", desc: "Command center access" },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b] relative font-sans text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#09090b] to-[#09090b] z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-blue-500/5 to-transparent rounded-full blur-3xl" />

      {/* Invisible recaptcha container */}
      <div id="recaptcha-container" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel p-8 md:p-10 rounded-[2rem] w-full max-w-md z-10 border border-zinc-800 shadow-2xl relative mx-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/10">
            <ShieldAlert size={32} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "phone" && "Phone Login"}
            {mode === "forgot" && "Reset Password"}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {mode === "login" && "Sign in to Secure CivicResQ Platform"}
            {mode === "signup" && "Join the Secure CivicResQ Network"}
            {mode === "phone" && "Login Securely with your phone number"}
            {mode === "forgot" && "We'll send you a Secure reset link"}
          </p>
        </div>

        {/* Error / Success */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== LOGIN ==================== */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <InputField
              icon={<Mail size={16} />}
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="user@gov.in"
            />
            <div className="relative">
              <InputField
                icon={<Lock size={16} />}
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </button>

            <SubmitButton loading={loading} icon={<LogIn size={18} />} label="Sign In" />

            <Divider />

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-zinc-700 hover:border-zinc-600 text-white font-semibold p-3 rounded-xl transition-all"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => switchMode("phone")}
              className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-zinc-700 hover:border-zinc-600 text-white font-semibold p-3 rounded-xl transition-all"
            >
              <Phone size={18} className="text-emerald-400" />
              Login with Phone OTP
            </button>
          </form>
        )}

        {/* ==================== SIGNUP ==================== */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <InputField icon={<User size={16} />} label="Full Name *" type="text" value={fullName} onChange={setFullName} placeholder="John Doe" />
            <InputField icon={<Phone size={16} />} label="Phone Number *" type="tel" value={phone} onChange={setPhone} placeholder="+91 9876543210" />
            <InputField icon={<Mail size={16} />} label="Email Address *" type="email" value={email} onChange={setEmail} placeholder="user@gov.in" />
            <div className="relative">
              <InputField
                icon={<Lock size={16} />}
                label="Password *"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Role Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Select Role *</label>
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
              <p className="text-xs text-zinc-600 mt-1">
                {roleOptions.find((r) => r.value === role)?.desc}
              </p>
            </div>

            {/* Location Permission */}
            <div>
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
                <span className="text-sm font-semibold">
                  {locationEnabled ? "Location Enabled ✓" : "Enable Location Access"}
                </span>
              </button>
            </div>

            {/* Emergency Contact */}
            <InputField
              icon={<HeartPulse size={16} />}
              label="Emergency Contact"
              type="tel"
              value={emergencyContact}
              onChange={setEmergencyContact}
              placeholder="+91 9876543210"
            />

            <SubmitButton loading={loading} icon={<UserPlus size={18} />} label="Create Account" />
          </form>
        )}

        {/* ==================== PHONE OTP ==================== */}
        {mode === "phone" && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <InputField
                  icon={<Phone size={16} />}
                  label="Phone Number"
                  type="tel"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="+91 9876543210"
                />
                <SubmitButton loading={loading} icon={<ChevronRight size={18} />} label="Send OTP" />
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <p className="text-sm text-zinc-400 text-center">
                  OTP sent to <span className="text-white font-semibold">{phoneNumber}</span>
                </p>
                <InputField
                  icon={<Lock size={16} />}
                  label="Enter OTP Code"
                  type="text"
                  value={otpCode}
                  onChange={setOtpCode}
                  placeholder="123456"
                />
                <SubmitButton loading={loading} icon={<LogIn size={18} />} label="Verify & Login" />
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setConfirmationResult(null); setOtpCode(""); }}
                  className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← Change phone number
                </button>
              </form>
            )}
          </>
        )}

        {/* ==================== FORGOT PASSWORD ==================== */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <InputField
              icon={<Mail size={16} />}
              label="Email Address"
              type="email"
              value={resetEmail}
              onChange={setResetEmail}
              placeholder="user@gov.in"
            />
            <SubmitButton loading={loading} icon={<Mail size={18} />} label="Send Reset Link" />
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          {mode === "login" && (
            <p className="text-sm text-zinc-400">
              Don&apos;t have access?{" "}
              <button onClick={() => switchMode("signup")} className="text-blue-400 font-bold hover:underline">
                Request Account
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-sm text-zinc-400">
              Already authenticated?{" "}
              <button onClick={() => switchMode("login")} className="text-blue-400 font-bold hover:underline">
                Sign In
              </button>
            </p>
          )}
          {(mode === "phone" || mode === "forgot") && (
            <p className="text-sm text-zinc-400">
              <button onClick={() => switchMode("login")} className="text-blue-400 font-bold hover:underline">
                ← Back to Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* -------- Reusable Sub-Components -------- */

function InputField({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SubmitButton({ loading, icon, label }: { loading: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-xl mt-2 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-[rgba(24,24,27,0.7)] px-3 text-zinc-500 font-medium">or continue with</span>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
