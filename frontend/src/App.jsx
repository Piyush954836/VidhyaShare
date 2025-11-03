import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import useThemeStore from "./store/themeStore";
import ProtectedRoute from "./components/ProtectedRoute";
// ✨ NEW: Import the Admin page and its protected route
import AdminRoute from "./components/AdminRoute";
import Admin from "./pages/Admin";

// ... (all other page imports)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SkillDetails from "./pages/SkillDetails";
import Requests from "./pages/Requests";
import Explore from "./pages/Explore";
import MySkills from "./pages/MySkills";
import Notifications from "./pages/Notifications";
import Offers from "./pages/Offers";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import AdminTests from "./pages/AdminTests";
import LiveSession from "./pages/LiveSession";
import CourseDetails from "./pages/CourseDetails";
import MyLearning from "./pages/MyLearning";
import OAuthRedirectHandler from "./pages/OAuthRedirectHandler";

function App() {
  const darkMode = useThemeStore((state) => state.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore" element={<Explore />} />
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skills/:id"
          element={
            <ProtectedRoute>
              <SkillDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests />
            </ProtectedRoute>
          }
        />
        {/* ✨ UPDATED: Changed '/profile/:id' to '/profile' for the user's own profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-skills"
          element={
            <ProtectedRoute>
              <MySkills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-session/:sessionId"
          element={
            <ProtectedRoute>
              <LiveSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        // ✨ NEW: Add a route for "My Learning" (we can build this page next)
        <Route
          path="/my-learning"
          element={<ProtectedRoute>{<MyLearning />}</ProtectedRoute>}
        />
        <Route
          path="/offers"
          element={
            <ProtectedRoute>
              <Offers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        // The new chat dashboard that lists all conversations
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:roomId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
       
        {/* ✨ NEW: Admin-only Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tests"
          element={
            <AdminRoute>
              <AdminTests />
            </AdminRoute>
          }
        />
        <Route path="/oauth/callback" element={<OAuthRedirectHandler />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover
        hideProgressBar={false}
        newestOnTop
      />
    </>
  );
}

export default App;
