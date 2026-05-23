export type UserRole = "citizen" | "responder" | "admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  fullName: string;
  phone: string;
  role: UserRole;
  emergencyContact: string;
  locationEnabled: boolean;
  photoURL: string | null;
  approved: boolean; // responder accounts need admin approval
  createdAt: number;
}

export const ROLE_ROUTES: Record<UserRole, string> = {
  citizen: "/report",
  responder: "/responder",
  admin: "/admin",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: "Citizen",
  responder: "Field Responder",
  admin: "Admin",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  citizen: "rose",
  responder: "emerald",
  admin: "blue",
};
