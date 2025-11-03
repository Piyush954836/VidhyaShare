import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from "agora-rtc-sdk-ng";
import { toast } from "react-toastify";
import { Mic, Video, PhoneOff } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from '../context/AuthContext';
import { useLocation, useParams, useNavigate } from "react-router-dom";

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

// Accept props, support both modal (props) and route/param (student)
export default function LiveSession({ session: propSession, onClose }) {
  const { token } = useAuth();
  const location = useLocation();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Merge - prop > state > param
  const session =
    propSession ||
    location.state?.session ||
    (sessionId ? { id: sessionId } : undefined);

  // Log what's received for debugging
  console.log("LiveSession: received propSession:", propSession);
  console.log("LiveSession: computed session object:", session);

  const [agoraConfig, setAgoraConfig] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const hasJoined = useRef(false);

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

  // Agora RTC join/publish/track management
  useEffect(() => {
    if (!agoraConfig) return;
    if (hasJoined.current) return;

    rtcClient.on("user-published", async (user, mediaType) => {
      await rtcClient.subscribe(user, mediaType);
      setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
      if (mediaType === "audio") user.audioTrack?.play();
    });
    rtcClient.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video")
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });
    rtcClient.on("user-left", user => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    const initAndJoin = async () => {
      hasJoined.current = true;
      try {
        await rtcClient.join(
          agoraConfig.appId,
          agoraConfig.channelName,
          agoraConfig.token,
          null
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
        {/* Local Video */}
        {localTracks[1] && (
          <div className="relative bg-black border-2 border-indigo-500 rounded-lg overflow-hidden">
            {cameraOn ? (
              <AgoraVideoPlayer
                videoTrack={localTracks[1]}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <p>Camera is off</p>
              </div>
            )}
            <span className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-sm rounded">
              You
            </span>
          </div>
        )}
        {/* Remote Users */}
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
            <span className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-sm rounded">
              User {user.uid}
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
          onClick={() => (onClose ? onClose() : navigate(-1))}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
