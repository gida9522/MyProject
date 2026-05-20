import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!token || !user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0) {
    const ok = roles.includes(user.role);
    if (!ok) return <Navigate to={roles[0] ? "/" : "/"} replace />;
  }

  return children;
}
