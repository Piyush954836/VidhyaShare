import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

// Sample notifications data
const sampleNotifications = [
  {
    id: 1,
    type: "request",
    message: "Alice requested your skill: React Basics",
    status: "unread",
    time: "2h ago",
  },
  {
    id: 2,
    type: "chat",
    message: "Bob sent you a new message",
    status: "unread",
    time: "3h ago",
  },
  {
    id: 3,
    type: "system",
    message: "New features are available in Skill Trading",
    status: "read",
    time: "1d ago",
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(sampleNotifications);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
  };

  const statusColors = {
    unread: "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100",
    read: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <div className="px-4 md:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              Notifications
            </h1>
            <Button onClick={markAllRead} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600">
              Mark All as Read
            </Button>
          </div>

          {notifications.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
              <h3 className="text-xl font-semibold mb-2">No notifications</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You have no notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  title={n.type.charAt(0).toUpperCase() + n.type.slice(1)}
                  className={`hover:-translate-y-1 transition-transform`}
                >
                  <p className={`mt-2 ${statusColors[n.status]} px-2 py-1 rounded-full inline-block text-xs`}>
                    {n.status.toUpperCase()}
                  </p>
                  <p className="mt-4">{n.message}</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{n.time}</p>
                  {n.status === "unread" && (
                    <div className="mt-4 flex justify-end">
                      <Button onClick={() => markAsRead(n.id)}>Mark as Read</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
