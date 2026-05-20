import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar() {
  const { user, signOut } = useContext(AuthContext);
  const role = user?.role;

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold tracking-wide">Internship Platform</div>

        <div className="flex items-center gap-4">
          {role === "SUPER_ADMIN" && (
            <NavLink to="/super-admin" className="px-3 py-2 rounded-md text-sm hover:bg-slate-800">
              Super Admin
            </NavLink>
          )}
          {role === "UNIVERSITY" && (
            <NavLink to="/university" className="px-3 py-2 rounded-md text-sm hover:bg-slate-800">
              University
            </NavLink>
          )}
          {role === "ORGANIZATION" && (
            <NavLink to="/organization" className="px-3 py-2 rounded-md text-sm hover:bg-slate-800">
              Organization
            </NavLink>
          )}
          {role === "STUDENT" && (
            <NavLink to="/student" className="px-3 py-2 rounded-md text-sm hover:bg-slate-800">
              Student
            </NavLink>
          )}

          <button
            type="button"
            onClick={signOut}
            className="px-3 py-2 rounded-md text-sm bg-emerald-600 hover:bg-emerald-500 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

