import { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import UniversityDashboard from "./pages/UniversityDashboard";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AppLayout from "./components/layout/AppLayout";

export default function App() {
  const { token, user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          token && user ? (
            <Navigate to={`/${user.role === "SUPER_ADMIN" ? "super-admin" : user.role.toLowerCase()}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/super-admin"
        element={
          <ProtectedRoute roles={["SUPER_ADMIN"]}>
            <AppLayout />
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university"
        element={
          <ProtectedRoute roles={["UNIVERSITY"]}>
            <AppLayout />
            <UniversityDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute roles={["ORGANIZATION"]}>
            <AppLayout />
            <OrganizationDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <AppLayout />
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
