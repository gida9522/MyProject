import { createContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

const TOKEN_KEY = "ims_jwt_token";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (!token) return;

        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // backend returns: { data: { user: req.user, profile } }
        setUser(res.data?.data?.user ?? res.data?.data ?? null);
      } catch (e) {
        // token invalid/expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      loading,
      signIn: ({ token: newToken, user: userObj }) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(userObj);
      },
      signOut: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    };
  }, [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
