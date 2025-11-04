import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from "agora-rtm-sdk";
import { toast } from "react-toastify";
import { Mic, Video, PhoneOff } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import ChatPanel from "./ChatPanel";

// Singleton RTC client
const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function AgoraVideoPlayer({ videoTrack, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && videoTrack) {
      videoTrack.play(ref.current);
      return () => videoTrack.stop();
    }
  }, [videoTrack]);
  return <div ref={ref} className={className} />;
}

export default function LiveSession({ session: propSession, onClose }) {
  const { token, user } = useAuth();
  const location = useLocation();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Merge session props
  const session =
    propSession ||
    location.state?.session ||
    (sessionId ? { id: sessionId } : undefined);

  // Agora state
  const [agoraConfig, setAgoraConfig] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [screenTrack, setScreenTrack] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharer, setRemoteScreenSharer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasJoined = useRef(false);
  const [rtmClient, setRtmClient] = useState(null);
  const [rtmChannel, setRtmChannel] = useState(null);

  // RTM chat state
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showChat, setShowChat] = useState(false);


  // Defensive: error if NO session or no session.id
  if (!session || !session.id) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white z-50">
        <div>
          <h2 className="text-xl font-bold text-red-400 mb-2">
            Invalid session link
          </h2>
          <p>
            This session could not be found or you reloaded directly.
            Please access the session from your enrolled course page or profile.
          </p>
          <button
            onClick={() => (onClose ? onClose() : navigate(-1))}
            className="mt-4 py-2 px-4 bg-indigo-600 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Fetch join token/config
  useEffect(() => {
    const fetchAgoraConfig = async () => {
      try {
        const res = await axiosInstance.get(`/sessions/${session.id}/join`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAgoraConfig(res.data);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to join the session.");
        setTimeout(() => (onClose ? onClose() : navigate(-1)), 1500);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgoraConfig();
    // eslint-disable-next-line
  }, [session.id, token]);

  // RTC join/publish/track management + handle screen sharing
  useEffect(() => {
    if (!agoraConfig) return;
    if (hasJoined.current) return;

    // RTC event handlers
    rtcClient.on("user-published", async (user, mediaType) => {
      await rtcClient.subscribe(user, mediaType);
      setRemoteUsers(prev => [
        ...prev.filter(u => u.uid !== user.uid),
        user
      ]);

      // Detect remote screen share via user.videoTrack.getTrackLabel()
      if (
        mediaType === "video" &&
        user.videoTrack &&
        user.videoTrack.getTrackLabel &&
        user.videoTrack.getTrackLabel().toLowerCase().includes("screen")
      ) {
        setRemoteScreenSharer(user.uid);
      }

      if (mediaType === "audio") user.audioTrack?.play();
    });
    rtcClient.on("user-unpublished", (user, mediaType) => {
      if (
        mediaType === "video" &&
        remoteScreenSharer === user.uid
      ) {
        setRemoteScreenSharer(null);
      }
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });
    rtcClient.on("user-left", user => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      if (remoteScreenSharer === user.uid) setRemoteScreenSharer(null);
    });

    const initAndJoin = async () => {
      hasJoined.current = true;
      try {
        await rtcClient.join(
          agoraConfig.appId,
          agoraConfig.channelName,
          agoraConfig.token,
          user.id
        );
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalTracks(tracks);
        await rtcClient.publish(tracks);
      } catch (e) {
        hasJoined.current = false;
        toast.error("Error joining Agora session.");
      }
    };
    initAndJoin();

    return () => {
      if (hasJoined.current) {
        if (screenTrack) {
          screenTrack.stop();
          screenTrack.close();
        }
        localTracks.forEach(track => {
          track.stop();
          track.close();
        });
        rtcClient.removeAllListeners();
        rtcClient.leave();
        hasJoined.current = false;
      }
    };
    // eslint-disable-next-line
  }, [agoraConfig]);

  // ------------------ Screen sharing -----------------
  const handleToggleScreenShare = async () => {
  if (!isScreenSharing && remoteScreenSharer) {
    toast.error("Someone else is already sharing their screen.");
    return;
  }
  if (!isScreenSharing) {
    // Start screen share
    const sTrack = await AgoraRTC.createScreenVideoTrack();
    setScreenTrack(sTrack);
    if (localTracks[1]) {
      await rtcClient.unpublish(localTracks[1]);  // Unpublish camera only if it exists
    }
    await rtcClient.publish(sTrack);
    setIsScreenSharing(true);

    sTrack.on("track-ended", async () => {
      await rtcClient.unpublish(sTrack);
      if (localTracks[1]) {
        await rtcClient.publish(localTracks[1]);
      }
      setIsScreenSharing(false);
      setScreenTrack(null);
    });
  } else {
    // Stop screen share
    if (screenTrack) {
      await rtcClient.unpublish(screenTrack);
      if (localTracks[1]) {
        await rtcClient.publish(localTracks[1]);
      }
      setIsScreenSharing(false);
      setScreenTrack(null);
    }
  }
};


  const handleMicToggle = async () => {
    if (localTracks[0]) {
      await localTracks[0].setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };
  const handleCameraToggle = async () => {
    if (localTracks[1]) {
      await localTracks[1].setEnabled(!cameraOn);
      setCameraOn(!cameraOn);
    }
  };


  // --------------- Remove & Block a user -----------------
  const handleKickBan = async uid => {
    try {
      await axiosInstance.post("/sessions/block-user", {
        channelName: agoraConfig.channelName,
        uid
      });
      toast.success(`User ${uid} removed and blocked!`);
    } catch (err) {
      toast.error("Failed to remove/block user.");
    }
  };

  // --------------- Agora RTM (Chat) -----------------
  useEffect(() => {
  if (!agoraConfig) return;
  let client, channel;
  (async () => {
    client = AgoraRTM.createInstance(agoraConfig.appId);
    await client.login({ uid: String(user.id) });
    channel = client.createChannel(agoraConfig.channelName);
    await channel.join();
    setRtmClient(client);
    setRtmChannel(channel);
  })();

  return () => {
    channel?.leave();
    client?.logout();
  };
  // eslint-disable-next-line
}, [agoraConfig]);

  const sendMessage = async () => {
    if (rtmChannel && message.trim()) {
      await rtmChannel.sendMessage({ text: message });
      setMessages(msgs => [...msgs, { senderId: String(user.id), text: message }]);
      setMessage("");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <p className="text-white">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col p-4 z-50">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
        {/* Local Screen share/camera */}
        {(isScreenSharing && screenTrack) ? (
          <AgoraVideoPlayer videoTrack={screenTrack} className="w-full h-full object-cover" />
        ) : (
          localTracks[1] && (
            <AgoraVideoPlayer videoTrack={localTracks[1]} className="w-full h-full object-cover" />
          )
        )}
        {/* Remote Users (show screen share user separately) */}
        {remoteUsers.map(user => (
          <div key={user.uid} className="relative bg-black border-2 border-gray-700 rounded-lg overflow-hidden">
            {user.hasVideo ? (
              <AgoraVideoPlayer
                videoTrack={user.videoTrack}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <p>User {user.uid}'s camera is off</p>
              </div>
            )}
            {/* Kick/Block Button (show for everyone except yourself) */}
            {String(user.uid) !== String(user.id) && (
              <button
                onClick={() => handleKickBan(user.uid)}
                className="absolute top-2 right-2 bg-red-700 text-xs px-2 py-1 rounded"
              >
                Remove & Block
              </button>
            )}
            <span className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-sm rounded">
              User {user.uid}
              {remoteScreenSharer === user.uid && " (Screen Sharing)"}
            </span>
          </div>
        ))}
      </div>
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 p-4">
        <button
          onClick={handleMicToggle}
          className={`p-3 rounded-full ${micOn ? "bg-gray-600" : "bg-red-500"}`}
        >
          <Mic size={24} />
        </button>
        <button
          onClick={handleCameraToggle}
          className={`p-3 rounded-full ${cameraOn ? "bg-gray-600" : "bg-red-500"}`}
        >
          <Video size={24} />
        </button>
        <button
          onClick={handleToggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? "bg-green-600" : "bg-gray-600"}`}
        >
          {/* Replace with a proper icon */}
          {isScreenSharing ? "🛑" : "🖥️"}
        </button>
        <button
          onClick={() => (onClose ? onClose() : navigate(-1))}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700"
        >
          <PhoneOff size={24} />
        </button>

        <button
          onClick={() => setShowChat((v) => !v)}
          className={`p-3 rounded-full ${showChat ? "bg-indigo-700" : "bg-gray-600"}`}
          title="Open Chat"
        >
          {/* Use a chat/message icon if you like */}
          <span role="img" aria-label="chat">💬</span>
        </button>

      </div>
      {/* Chat Panel */}
      {showChat && rtmChannel && (
        <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <span className="text-lg font-bold">Group Chat</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-300 hover:text-red-400"
              title="Close"
            >
              ✖
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatPanel rtmChannel={rtmChannel} userId={user.id} />
          </div>
        </div>
      )}


      {/* Screen share notice */}
      {remoteScreenSharer && !isScreenSharing && (
        <div className="text-yellow-400 mt-2 text-center">
          Screen sharing in progress by User {remoteScreenSharer}
        </div>
      )}
    </div>
  );
}
