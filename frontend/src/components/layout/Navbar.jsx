import { useState, useEffect } from "react";
import { MoonIcon, SunIcon, Bars3Icon } from "@heroicons/react/24/outline";
import useThemeStore from "../../store/themeStore";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import NotificationBell from "../NotificationBell";

const Navbar = () => {
  const { darkMode, toggleTheme } = useThemeStore();
  const { user, token, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id || !token) return;

      try {
        const res = await axiosInstance.get(`/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profile = res.data;
        let avatarUrl;

        if (profile.avatar_url) {
          // Extract filename
          const filename = profile.avatar_url.split("/").pop();
          
          // Construct Base URL (Your specific bucket path)
          const baseUrl = `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/avatars/avatars/${filename}`;
          
          // --- THE FIX: Add Cache Buster ---
          // We append a timestamp query param. If your profile object has 'updated_at', 
          // use: const timestamp = new Date(profile.updated_at).getTime();
          // Otherwise, Date.now() works to force refresh on page load.
          const timestamp = new Date().getTime(); 
          avatarUrl = `${baseUrl}?t=${timestamp}`;
          
        } else {
          avatarUrl = `https://i.pravatar.cc/150?u=${user.id}`;
        }
        setAvatar(avatarUrl);
      } catch (err) {
        console.error("Error fetching avatar:", err);
        setAvatar(`https://i.pravatar.cc/150?u=${user.id}`);
      }
    };
    fetchAvatar();
  }, [user?.id, token]);

  const handleLogout = async () => {
    await logout();
    setOpenMenu(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 shadow-md px-3 md:px-6 py-2 flex justify-between items-center transition-colors duration-500">
      <Link to="/" className="flex items-center gap-2">
        <h1 className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
          VidhyaShare Community
        </h1>
      </Link>
      <div className="flex items-center gap-2 sm:gap-4 relative">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          {darkMode ? (
            <SunIcon className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-200" />
          )}
        </button>

        {user && <NotificationBell />}

        {user && avatar && (
          <div className="relative">
            <img
              src={avatar}
              alt={user.full_name || "Profile"}
              onError={(e) => {
                // Prevent infinite loop if fallback also fails
                e.target.onerror = null; 
                e.target.src = `https://i.pravatar.cc/150?u=${user.id}`;
              }}
              className="w-8 sm:w-10 md:w-12 aspect-square rounded-full cursor-pointer object-cover border-2 border-blue-500 dark:border-blue-400 transition-all duration-300 hover:ring-4 hover:ring-blue-300 dark:hover:ring-blue-700"
              onClick={() => setOpenMenu(!openMenu)}
              tabIndex={0}
            />
            {/* Responsive dropdown */}
            {openMenu && (
              <div className="absolute right-0 mt-3 min-w-40 sm:min-w-44 bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn">
                <div className="py-1">
                  <Link
                    to={`/profile/${user.id}`}
                    className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => setOpenMenu(false)}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors duration-200 border-t border-gray-100 dark:border-gray-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!user && (
          <Link
            to="/login"
            className="px-3 py-1 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;