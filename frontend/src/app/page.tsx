"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROLE_ROUTES } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        // If not logged in or profile missing, go to login
        router.replace("/login");
      } else {
        // Redirect to their respective dashboard
        if (profile.role === "responder" && !profile.approved) {
          router.replace("/pending-approval");
        } else {
          router.replace(ROLE_ROUTES[profile.role]);
        }
      }
    }
  }, [user, profile, loading, router]);

  // Brief loading state while determining auth status
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
      <Loader2 size={40} className="animate-spin text-emerald-500" />
    </main>
  );
}
