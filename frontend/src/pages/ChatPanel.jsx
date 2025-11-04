import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

export default function ChatPanel({ rtmChannel, userId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef();

  useEffect(() => {
    if (!rtmChannel) {
      setConnected(false);
      return;
    }

    let isMounted = true;
    // Listen for incoming messages
    const handler = ({ text }, senderId) => {
      if (isMounted)
        setMessages((msgs) => [...msgs, { senderId, text }]);
    };

    rtmChannel.on("ChannelMessage", handler);

    // Mark connected once channel is confirmed joined
    setConnected(true);

    return () => {
      isMounted = false;
      rtmChannel.off("ChannelMessage", handler);
      setConnected(false);
    };
  }, [rtmChannel]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Robust send
  const sendMessage = async () => {
    try {
      if (!rtmChannel) {
        toast.warning("Chat is not connected yet.");
        return;
      }
      const trimmed = message.trim();
      if (!trimmed) {
        toast.warning("Message is empty.");
        return;
      }
      await rtmChannel.sendMessage({ text: trimmed });
      setMessages((msgs) => [
        ...msgs,
        { senderId: String(userId), text: trimmed },
      ]);
      setMessage("");
    } catch (e) {
      toast.error("Error sending message: " + (e.message || "Unknown error"));
      console.error(e);
    }
  };

  // UI
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden max-w-md flex flex-col h-56">
      {/* Status Indicator */}
      {!rtmChannel && (
        <div className="p-4 text-yellow-400 text-center">
          Connecting to chat&hellip;
        </div>
      )}
      {/* Chat Box */}
      {rtmChannel && (
        <>
          <div className="p-2 flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-gray-400">No messages yet.</div>
            ) : (
              messages.map((msg, i) => (
                <div key={i}>
                  <b className="mr-1">
                    {msg.senderId === String(userId) ? "You" : `User ${msg.senderId}`}:
                  </b>
                  {msg.text}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex border-t p-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-gray-700 rounded-l px-2 py-1 outline-none"
              placeholder="Type a message"
              onKeyDown={(e) =>
                e.key === "Enter" && connected && message.trim() && sendMessage()
              }
              disabled={!connected}
            />
            <button
              className="px-4 py-1 bg-indigo-600 rounded-r disabled:bg-gray-500"
              disabled={!connected || !message.trim()}
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
