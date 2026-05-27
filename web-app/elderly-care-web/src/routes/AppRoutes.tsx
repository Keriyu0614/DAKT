import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuthGuard from "./AuthGuard";
import ManagedElderlyGuard from "./ManagedElderlyGuard";

import { HomePage } from "../pages/home/HomePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { AppointmentsPage } from "../pages/appointments/AppointmentsPage";
import { MedicationsPage } from "../pages/medications/MedicationsPage";
import { HealthPage } from "../pages/health/HealthPage";
import { HealthSchedulePage } from "../pages/health/HealthSchedulePage";

import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { ElderlyPage } from "../pages/userelderly/ElderlyPage";
// import { SeedDataPage } from "../pages/dev/SeedDataPage"; // Commented out - using backend seed instead

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Dev Tools - Commented out, using backend seed instead */}
        {/* <Route path="/dev/seed" element={<SeedDataPage />} /> */}

        {/* Protected */}
        <Route element={<AuthGuard />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="medications" element={<MedicationsPage />} />
            <Route element={<ManagedElderlyGuard />}>
              <Route path="health" element={<HealthPage />} />
              <Route path="health-schedule" element={<HealthSchedulePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="elderly" element={<ElderlyPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
