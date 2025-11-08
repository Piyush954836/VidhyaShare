import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../config/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("supabase_token") || null);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // 🧩 Normalize avatar URL for frontend consistency
  const normalizeAvatarUrl = (profile) => {
    if (!profile?.avatar_url) return `https://i.pravatar.cc/150?u=${profile?.id}`;
    if (profile.avatar_url.startsWith("http")) return profile.avatar_url;

    const cleanPath = profile.avatar_url
      .replace(/^\/+/, "")
      .replace(/^uploads\//, "")
      .replace(/^avatars\//, "avatars/");

    return `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/${cleanPath}`;
  };

  // 🔹 Fetch user from backend using Supabase token
  const fetchUser = async () => {
    if (!token) {
      setLoadingSession(false);
      return;
    }

    try {
      // Ensure Supabase session is active
      await supabase.auth.setSession({ access_token: token });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch user");

      // 🧠 Normalize avatar here before saving
      const normalizedUser = { ...data, avatar_url: normalizeAvatarUrl(data) };

      setUser(normalizedUser);
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

      localStorage.setItem("supabase_token", accessToken);
      setToken(accessToken);

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: data.session?.refresh_token || "",
      });

      toast.success("Logged in successfully!");
      await fetchUser(); // ✅ immediately sync user data
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

      localStorage.setItem("supabase_token", accessToken);
      setToken(accessToken);

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: data.session?.refresh_token || "",
      });

      toast.success("Registered successfully!");
      await fetchUser(); // ✅ auto-login and sync profile
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
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] logout error:", err.message);
    }
    localStorage.removeItem("supabase_token");
    setToken(null);
    setUser(null);
    toast.success("Logged out!");
    navigate("/login");
  };

  // 🔹 Social login
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
