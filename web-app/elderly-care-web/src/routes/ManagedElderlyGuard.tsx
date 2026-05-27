import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ManagedElderlyGuard() {
  const { user, managedElderly } = useAuth();
  const isCaregiver = user?.role === "Caregiver" || user?.role === "1" || String(user?.role) === "1";

  if (isCaregiver && !managedElderly) {
    return <Navigate to="/app/elderly" replace />;
  }

  return <Outlet />;
}
