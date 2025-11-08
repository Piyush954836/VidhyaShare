import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

const NotificationContext = createContext();
const DEFAULT_AVATAR = (id) => `https://i.pravatar.cc/150?u=${id}`;

// Helper to fix avatar URLs
const formatAvatarUrl = (avatarUrl, id) => {
  if (avatarUrl && avatarUrl.trim() !== "") {
    const filename = avatarUrl.split("/").pop();
    return `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/avatars/avatars/${filename}`;
  }
  return DEFAULT_AVATAR(id);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔹 Fetch all notifications for this user
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("notifications")
          .select(`
            *,
            sender:profiles!notifications_sender_id_fkey(id, full_name, avatar_url)
          `)
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Ensure avatars have full URLs
        const formatted = (data || []).map((n) => ({
          ...n,
          sender: {
            ...n.sender,
            avatar_url: formatAvatarUrl(n.sender?.avatar_url, n.sender?.id),
          },
        }));

        setNotifications(formatted);
        setUnreadCount(formatted.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("[NotificationProvider] Fetch error:", err);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // 🔹 Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const notif = payload.new;
          if (!notif) return;

          if (payload.eventType === "INSERT") {
            try {
              const { data: senderData } = await axiosInstance.get(
                `/profile/${notif.sender_id}`
              );

              const sender = senderData
                ? {
                    full_name: senderData.full_name,
                    avatar_url: formatAvatarUrl(senderData.avatar_url, senderData.id),
                  }
                : { full_name: "Someone", avatar_url: DEFAULT_AVATAR("unknown") };

              const fullNotif = { ...notif, sender };

              setNotifications((prev) => [fullNotif, ...prev]);
              setUnreadCount((c) => c + 1);

              toast(
                ({ closeToast }) => (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      navigate(`/chat/${notif.room_id}`);
                      closeToast();
                    }}
                  >
                    <img
                      src={sender.avatar_url}
                      alt={sender.full_name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span>
                      <b>{sender.full_name}</b> sent you a message!
                    </span>
                  </div>
                ),
                {
                  position: "top-right",
                  autoClose: 5000,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  hideProgressBar: false,
                }
              );
            } catch (err) {
              console.error("[NotificationProvider] Failed to fetch sender info:", err);
            }
          }

          if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === notif.id ? { ...n, ...notif } : n))
            );
          }
        }
      )
      .subscribe((status) =>
        console.log("[NotificationProvider] Channel status:", status)
      );

    return () => supabase.removeChannel(channel);
  }, [user?.id, navigate]);

  const markAsRead = async (id) => {
    if (!id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("recipient_id", user.id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((count) => Math.max(count - 1, 0));
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  return useContext(NotificationContext);
}
