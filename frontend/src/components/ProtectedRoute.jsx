import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { token, loadingSession } = useAuth();

  if (loadingSession) return <div>Loading...</div>; // wait for user check
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
