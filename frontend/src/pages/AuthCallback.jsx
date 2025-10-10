import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token"); // backend sends JWT
    if (token) {
      localStorage.setItem("jwt", token);
      // Optionally fetch user data from backend
      fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .finally(() => navigate("/dashboard"));
    } else {
      navigate("/login");
    }
  }, []);

  return <div className="flex items-center justify-center h-screen">Loading...</div>;
};

export default AuthCallback;
