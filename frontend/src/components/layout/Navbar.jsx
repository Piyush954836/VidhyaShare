import { useState, useEffect } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import useThemeStore from "../../store/themeStore";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";

const Navbar = () => {
  const { darkMode, toggleTheme } = useThemeStore();
  const { user, token, logout } = useAuth(); // Use AuthContext for user state
  const [openMenu, setOpenMenu] = useState(false);
  const [avatar, setAvatar] = useState("");
  const navigate = useNavigate();

  // Fetch latest profile avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user || !token) return;
      try {
        const res = await axiosInstance.get("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Add cache-busting so latest image always shows
        setAvatar(`${res.data.avatar_url}?t=${Date.now()}`);
      } catch (err) {
        console.error("Navbar avatar fetch error:", err);
        setAvatar(`https://i.pravatar.cc/40?u=${user.id}`);
      }
    };
    fetchAvatar();
  }, [user, token]);

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setOpenMenu(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md px-4 md:px-6 py-3 flex justify-between items-center transition-colors duration-500">
      {/* Logo */}
      <Link
        to="/"
        className="font-bold text-xl md:text-2xl text-blue-600 dark:text-blue-400 transition-colors duration-500"
      >
        VidhyaShare Community
      </Link>

      {/* Right Section */}
      <div className="flex items-center gap-4 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          {darkMode ? (
            <SunIcon className="w-6 h-6 text-yellow-400" />
          ) : (
            <MoonIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          )}
        </button>

        {/* User Menu */}
        {user && (
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={user.full_name || "User"}
                className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600 transition-all duration-300"
                onClick={() => setOpenMenu(!openMenu)}
              />
            ) : (
              <div
                onClick={() => setOpenMenu(!openMenu)}
                className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-lg"
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            {openMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 z-50">
                <Link
                  to={`/profile/${user.id}`}
                  className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
                >
                  {user.full_name || "Profile"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
