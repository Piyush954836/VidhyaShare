import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from "agora-rtc-sdk-ng";
import { toast } from "react-toastify";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from '../context/AuthContext';

// ✨ Create a single, stable client instance OUTSIDE of the React component.
// This is the key to preventing connection race conditions.
const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// A custom video player to handle rendering Agora tracks
function AgoraVideoPlayer({ videoTrack, className }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && videoTrack) {
            // Play the track in the div referenced by this component
            videoTrack.play(ref.current);
            return () => {
                // Stop the track when the component unmounts
                videoTrack.stop();
            };
        }
    }, [videoTrack]);

    return <div ref={ref} className={className} />;
}

export default function LiveSession({ session, onClose }) {
    const { token } = useAuth();
    const [localTracks, setLocalTracks] = useState([]);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [agoraConfig, setAgoraConfig] = useState(null);
    
    // ✨ A flag to prevent the join logic from running multiple times due to Strict Mode
    const hasJoined = useRef(false);

    // Effect to fetch the token from your backend
    useEffect(() => {
        const fetchAgoraConfig = async () => {
            try {
                const res = await axiosInstance.get(`/sessions/${session.id}/join`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAgoraConfig(res.data);
            } catch (err) {
                toast.error(err.response?.data?.error || "Failed to join the session.");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        fetchAgoraConfig();
    }, [session.id, onClose, token]);

    // Effect to manage the entire call lifecycle
    useEffect(() => {
        // Don't run if we don't have the config yet
        if (!agoraConfig) return;

        const initAndJoin = async () => {
            // If we have already joined, do nothing. This prevents the error.
            if (hasJoined.current) return;

            // Event listeners for remote users
            rtcClient.on("user-published", async (user, mediaType) => {
                await rtcClient.subscribe(user, mediaType);
                setRemoteUsers(prev => [...prev, user]);
                if (mediaType === "audio") user.audioTrack?.play();
            });
            rtcClient.on("user-unpublished", (user, mediaType) => {
                if (mediaType === "video") setRemoteUsers(prev => prev.filter((u) => u.uid !== user.uid));
            });
            rtcClient.on("user-left", (user) => {
                setRemoteUsers(prev => prev.filter((u) => u.uid !== user.uid));
            });

            try {
                // Set the flag BEFORE starting the async operations to prevent re-entry
                hasJoined.current = true;

                await rtcClient.join(agoraConfig.appId, agoraConfig.channelName, agoraConfig.token, null);
                
                const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
                setLocalTracks(tracks);
                await rtcClient.publish(tracks);

            } catch (error) {
                console.error("Agora Connection Error:", error);
                hasJoined.current = false; // Reset the flag on error
            }
        };

        initAndJoin();

        // The cleanup function
        return () => {
            if (hasJoined.current) {
                localTracks.forEach(track => {
                    track.stop();
                    track.close();
                });
                rtcClient.removeAllListeners();
                rtcClient.leave();
                hasJoined.current = false; // Reset the flag on unmount
            }
        };
    }, [agoraConfig, localTracks]); // Dependencies updated for safety

    // --- Control Handlers ---
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
        return <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><p className="text-white">Connecting...</p></div>;
    }

    return (
        <div className="fixed inset-0 bg-gray-900 text-white flex flex-col p-4 z-50">
            {/* Video Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
                {/* Local Video */}
                {localTracks[1] && (
                    <div className="relative bg-black border-2 border-indigo-500 rounded-lg overflow-hidden">
                        {cameraOn ? (
                             <AgoraVideoPlayer videoTrack={localTracks[1]} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800"><p>Camera is off</p></div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-sm rounded">You</span>
                    </div>
                )}
                {/* Remote Users */}
                {remoteUsers.map(user => (
                    <div key={user.uid} className="relative bg-black border-2 border-gray-700 rounded-lg overflow-hidden">
                        {user.hasVideo ? (
                            <AgoraVideoPlayer videoTrack={user.videoTrack} className="w-full h-full object-cover" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-800"><p>User {user.uid}'s camera is off</p></div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-sm rounded">User {user.uid}</span>
                    </div>
                ))}
            </div>
            {/* Controls */}
            <div className="flex justify-center items-center gap-4 p-4">
                <button onClick={handleMicToggle} className={`p-3 rounded-full ${micOn ? "bg-gray-600" : "bg-red-500"}`}><Mic size={24} /></button>
                <button onClick={handleCameraToggle} className={`p-3 rounded-full ${cameraOn ? "bg-gray-600" : "bg-red-500"}`}><Video size={24} /></button>
                <button onClick={onClose} className="p-3 rounded-full bg-red-600 hover:bg-red-700"><PhoneOff size={24} /></button>
            </div>
        </div>
    );
}