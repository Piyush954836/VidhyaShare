import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../config/supabase"; // ✅ import supabase client

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("supabase_token") || null);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // 🔹 Fetch user from backend using Supabase token
  const fetchUser = async () => {
    if (!token) {
      setLoadingSession(false);
      return;
    }

    try {
      // 🧩 Restore Supabase session before any queries or subscriptions
      await supabase.auth.setSession({ access_token: token });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch user");

      setUser(data); // backend already merges profile + email
    } catch (err) {
      console.error("[AuthContext] fetchUser error:", err.message);
      localStorage.removeItem("supabase_token");
      setUser(null);
      setToken(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  // 🔹 Email/password login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("No access token received");

      // 🧩 Save token and restore Supabase session
      localStorage.setItem("supabase_token", accessToken);
      setToken(accessToken);
      setUser(data.user);

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: data.session?.refresh_token || "",
      });

      toast.success("Logged in successfully!");
    } catch (err) {
      console.error("[AuthContext] login error:", err.message);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Register
  const register = async (email, password, full_name) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("No access token received");

      // 🧩 Save token and restore Supabase session
      localStorage.setItem("supabase_token", accessToken);
      setToken(accessToken);
      setUser(data.user);

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: data.session?.refresh_token || "",
      });

      toast.success("Registered successfully!");
    } catch (err) {
      console.error("[AuthContext] register error:", err.message);
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut(); // ✅ Clear Supabase session
    } catch (err) {
      console.error("[AuthContext] logout error:", err.message);
    }
    localStorage.removeItem("supabase_token");
    setToken(null);
    setUser(null);
    toast.success("Logged out!");
    navigate("/login");
  };

  // 🔹 Social login (redirects to backend)
  const socialLogin = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/social-login/${provider}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loadingSession,
        login,
        logout,
        register,
        socialLogin,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
