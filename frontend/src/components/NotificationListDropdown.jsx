// src/components/NotificationListDropdown.js
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const DEFAULT_AVATAR = (id) => `https://i.pravatar.cc/150?u=${id}`;

const NotificationListDropdown = ({ close }) => {
  const { notifications, markAsRead, markAllRead } = useNotifications();

  if (!notifications.length) {
    return <div className="bg-white shadow rounded p-4 w-80">No notifications</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg w-80 max-h-80 overflow-y-auto border">
      <div className="flex justify-between items-center p-3 border-b">
        <span className="font-bold">Notifications</span>
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={markAllRead}
        >
          Mark all as read
        </button>
      </div>
      <ul>
        {notifications.map((n) => {
          const avatar = n.sender?.avatar_url || DEFAULT_AVATAR(n.sender?.id || n.id);

          return (
            <li
              key={n.id}
              className={`p-3 border-b flex flex-col ${!n.is_read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <img
                  src={avatar}
                  alt={n.sender?.full_name || 'Someone'}
                  className="w-6 h-6 rounded-full"
                />
                <span>
                  <b>{n.sender?.full_name || 'Someone'}</b> sent you a message.
                </span>
              </div>

              <span className="text-xs text-gray-500">
                {new Date(n.created_at).toLocaleString()}
              </span>

              <div className="mt-1 flex gap-2">
                <Link
                  to={`/chat/${n.room_id}`}
                  className="text-blue-600 text-xs underline"
                  onClick={() => {
                    markAsRead(n.id);
                    close();
                  }}
                >
                  Go to chat
                </Link>
                {!n.is_read && (
                  <button
                    className="text-xs text-gray-400 hover:underline"
                    onClick={() => markAsRead(n.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NotificationListDropdown;
