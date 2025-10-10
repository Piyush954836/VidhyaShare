import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [active, setActive] = useState(
    location.pathname.split("/")[1] || "dashboard"
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setActive(location.pathname.split("/")[1] || "dashboard");
  }, [location]);

  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Explore", path: "/explore" },
    { name: "Profile", path: "/profile" },
    { name: "Chat", path: "/chat" },
    { name: "My Skills", path: "/my-skills" },
    { name: "My Learning", path: "/my-learning" },
    { name: "Notifications", path: "/notifications" },
    { name: "Offers", path: "/offers" },
    { name: "Requests", path: "/requests" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-900 shadow-md"
        onClick={() => setIsOpen(true)}
      >
        <HiMenu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 w-64 h-full p-6 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          {/* ✨ FIXED: Removed 'md:static' to make the sidebar sticky on desktop */}
        `}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end md:hidden mb-4">
          <button onClick={() => setIsOpen(false)}>
            <HiX size={24} />
          </button>
        </div>

        {/* Links container with vertical scrolling if needed */}
        <div className="h-full overflow-y-auto pb-10">
          <ul className="space-y-4">
            {links.map((link) => {
              const isActive =
                location.pathname === link.path ||
                active === link.name.toLowerCase().replace(" ", "-");
              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    onClick={() => {
                      setActive(link.name.toLowerCase().replace(" ", "-"));
                      setIsOpen(false);
                    }}
                    className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {user && user.role === "admin" && (
            <>
              <hr className="my-6 border-gray-200 dark:border-gray-700" />

              {/* Admin section heading */}
              <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin Tools
              </div>

              <ul className="space-y-2">
                {/* Link to Manage Skills */}
                <li>
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                      location.pathname === "/admin"
                        ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    Manage Skills
                  </Link>
                </li>

                {/* Link to Manage Tests */}
                <li>
                  <Link
                    to="/admin/tests"
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                      location.pathname === "/admin/tests"
                        ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    Manage Tests
                  </Link>
                </li>
              </ul>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
