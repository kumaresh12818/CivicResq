"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole, ROLE_ROUTES } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const bypassApproval = (process.env.NEXT_PUBLIC_BYPASS_RESPONDER_APPROVAL || "true") === "true";

  useEffect(() => {
    if (loading) return;

    // Not logged in — redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // No profile yet — send to complete profile
    if (!profile) {
      router.push("/complete-profile");
      return;
    }

    // Responder not approved
    if (profile.role === "responder" && !profile.approved && !bypassApproval) {
      router.push("/pending-approval");
      return;
    }

    // Role not allowed on this page
    if (!allowedRoles.includes(profile.role)) {
      router.push(ROLE_ROUTES[profile.role]);
      return;
    }
  }, [user, profile, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
        <p className="text-zinc-400 text-sm font-medium">Authenticating…</p>
      </div>
    );
  }

  if (!user || !profile) return null;
  if (profile.role === "responder" && !profile.approved && !bypassApproval) return null;
  if (!allowedRoles.includes(profile.role)) return null;

  return <>{children}</>;
}
