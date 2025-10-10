import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OAuthRedirectHandler = () => {
  const navigate = useNavigate();
  const { setToken, refreshUser } = useAuth();

  useEffect(() => {
    // Parse access_token from hash fragment (#access_token=...)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");


    if (accessToken) {
      // Exchange Supabase token for backend JWT
      fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/auth/oauth-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            localStorage.setItem("jwt", data.token);
            setToken(data.token);

            refreshUser()
              .then(() => {
                console.log("User fetched successfully, redirecting to dashboard");
                navigate("/dashboard");
              })
              .catch(err => {
                console.error("Error fetching user after OAuth:", err);
                navigate("/login");
              });
          } else {
            console.error("No backend JWT returned:", data);
            navigate("/login");
          }
        })
        .catch(err => {
          console.error("OAuth exchange error:", err);
          navigate("/login");
        });
    } else {
      console.log("No access_token found in hash, redirecting to login");
      navigate("/login");
    }
  }, []);

  return <div>Logging in...</div>;
};

export default OAuthRedirectHandler;
