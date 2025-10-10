import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import useThemeStore from "../store/themeStore";

const Settings = () => {
  const { darkMode, toggleTheme } = useThemeStore();
  const [notifications, setNotifications] = useState(true);
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("");

  const handleSave = () => {
    alert("Settings saved!");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="px-4 md:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-white">
            Settings
          </h1>

          {/* Theme Settings */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Theme</h2>
            <div className="flex items-center gap-4">
              <span>Dark Mode:</span>
              <Button
                onClick={toggleTheme}
                className={`px-6 py-2 rounded-xl ${
                  darkMode
                    ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-blue-600 hover:to-purple-600"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {darkMode ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="flex items-center gap-4">
              <span>Email Notifications:</span>
              <Button
                onClick={() => setNotifications(!notifications)}
                className={`px-6 py-2 rounded-xl ${
                  notifications
                    ? "bg-gradient-to-r from-green-400 via-lime-400 to-green-600 hover:from-green-600 hover:to-green-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {notifications ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </section>

          {/* Account Settings */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Account / Security</h2>
            <div className="flex flex-col gap-4 max-w-md">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-purple-600 hover:to-blue-600"
              >
                Save Changes
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Settings;
