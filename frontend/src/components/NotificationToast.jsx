// src/components/NotificationToast.js
import React from "react";

const DEFAULT_AVATAR = (id) => `https://i.pravatar.cc/150?u=${id}`;

const NotificationToast = ({ sender, message, onClick }) => {
  const avatar = sender?.avatar_url || DEFAULT_AVATAR(sender?.id || "default");

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
    >
      {avatar ? (
        <img
          src={avatar}
          alt={sender?.full_name || "Someone"}
          className="w-10 h-10 rounded-full object-cover border"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold">
          {sender?.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-semibold text-gray-800">{sender?.full_name || "Someone"}</span>
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  );
};

export default NotificationToast;
