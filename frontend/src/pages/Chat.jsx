import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabase";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import { MessageSquare } from "lucide-react";

// ✅ FIXED: Avatar URL normalization helper
function getAvatarUrl(profile) {
  if (!profile?.avatar_url) {
    return `https://i.pravatar.cc/150?u=${profile?.id}`;
  }

  // Normalize the avatar path to remove any "/uploads/" or leading slashes
  const cleanPath = profile.avatar_url
    .replace(/^\/+/, "") // remove leading slash(es)
    .replace(/^uploads\//, "") // remove "uploads/" prefix if exists
    .replace(/^avatars\//, "avatars/"); // ensure it starts correctly

  return `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/avatars/${cleanPath}`;
}

const Chat = () => {
  const { roomId } = useParams();
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-start px-2 md:px-8 py-4 transition-all">
          <div className="w-full max-w-3xl flex-1">
            {roomId ? <ChatRoom roomId={roomId} /> : <ChatList />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;

function ChatList() {
  const [chatRooms, setChatRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      if (!token) return;
      try {
        const response = await axiosInstance.get("/chat", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChatRooms(response.data || []);
      } catch (error) {
        toast.error("Failed to load your conversations.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [token]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-5 text-blue-700 dark:text-white">
        Conversations
      </h1>
      {isLoading ? (
        <p className="text-center text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {chatRooms.length > 0 ? (
            chatRooms.map((room) => (
              <Link
                to={`/chat/${room.room_id}`}
                key={room.room_id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700 flex items-center gap-4 hover:bg-blue-50 dark:hover:bg-slate-700 transition duration-300"
              >
                <img
                  src={getAvatarUrl(room.other_participant)}
                  alt={room.other_participant.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                />
                <div>
                  <span className="font-semibold text-blue-800 dark:text-blue-300">
                    {room.other_participant.name}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to view conversation
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center text-gray-500 p-10 border-2 border-dashed rounded-lg">
              <MessageSquare
                size={40}
                className="mx-auto text-slate-400 mb-2"
              />
              <p>You have no active conversations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatRoom({ roomId }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!roomId || !token) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/chat/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data || []);
    } catch (error) {
      toast.error("Failed to load messages for this room.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!input.trim()) return;
      const tempId = Math.random();
      const newMessage = {
        id: tempId,
        content: input.trim(),
        sender: {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
        sent_at: new Date().toISOString(),
        status: "sent",
      };
      setMessages((prev) => [...prev, newMessage]);
      const currentInput = input;
      setInput("");
      try {
        await axiosInstance.post(
          `/chat/${roomId}/messages`,
          { content: currentInput.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        toast.error("Message failed to send.");
        setInput(currentInput);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    },
    [input, roomId, token, user]
  );

  return (
    <div className="w-full flex flex-col h-full relative">
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 flex flex-col overflow-y-auto">
        {isLoading ? (
          <p className="m-auto text-slate-500">Loading chat history...</p>
        ) : messages.length === 0 ? (
          <p className="m-auto text-gray-500">No messages yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isCurrent = msg.sender?.id === user.id;
              const avatarUrl = getAvatarUrl(msg.sender);
              console.log(msg.sender);
              let statusIcon = null;
              if (isCurrent) {
                statusIcon =
                  msg.status === "seen" ? (
                    <span
                      title="Seen"
                      className="text-green-600 font-semibold text-xl align-middle"
                    >
                      ✓✓
                    </span>
                  ) : msg.status === "delivered" ? (
                    <span
                      title="Delivered"
                      className="text-gray-400 font-semibold text-xl align-middle"
                    >
                      ✓✓
                    </span>
                  ) : msg.status === "sent" ? (
                    <span
                      title="Sent"
                      className="text-gray-400 font-semibold text-xl align-middle"
                    >
                      ✓
                    </span>
                  ) : null;
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-3 ${
                    isCurrent ? "flex-row-reverse self-end" : "self-start"
                  }`}
                >
                  <img
                    src={avatarUrl}
                    alt={msg.sender?.full_name || "User"}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-blue-300"
                  />
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-xs md:max-w-md break-words shadow-sm ${
                      isCurrent
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong
                        className={`block text-xs ${
                          isCurrent
                            ? "opacity-70"
                            : "text-blue-800 dark:text-blue-200 opacity-90"
                        }`}
                      >
                        {isCurrent ? "You" : msg.sender?.full_name || "..."}
                      </strong>
                      {isCurrent && statusIcon && (
                        <span className="ml-2">{statusIcon}</span>
                      )}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef}></div>
          </div>
        )}
      </div>
      <form
        onSubmit={sendMessage}
        className="mt-4 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm"
        style={{ position: "relative" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border-0 rounded-xl px-4 py-2 bg-transparent dark:bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
        />
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 font-medium"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
