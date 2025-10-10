import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabase";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import { MessageSquare } from 'lucide-react';

// --- Main Chat Page Component (acts as a router) ---
const Chat = () => {
    const { roomId } = useParams();

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar />
                <main className="flex-1 flex p-4 md:p-6 overflow-hidden">
                    {roomId ? <ChatRoom roomId={roomId} /> : <ChatList />}
                </main>
            </div>
        </div>
    );
};

export default Chat;


// --- Sub-component for the CHAT LIST (Dashboard) ---
function ChatList() {
    const [chatRooms, setChatRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchRooms = async () => {
            if (!token) return;
            try {
                const response = await axiosInstance.get('/chat', {
                    headers: { Authorization: `Bearer ${token}` }
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
            <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Conversations</h1>
            {isLoading ? <p className="text-center text-slate-500">Loading...</p> : (
                <div className="space-y-3">
                    {chatRooms.length > 0 ? chatRooms.map(room => (
                        <Link to={`/chat/${room.room_id}`} key={room.room_id}
                             className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <img src={room.other_participant.avatar_url || `https://i.pravatar.cc/150?u=${room.other_participant.id}`} alt={room.other_participant.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{room.other_participant.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Click to view conversation</p>
                            </div>
                        </Link>
                    )) : (
                        <div className="text-center text-gray-500 p-10 border-2 border-dashed rounded-lg">
                            <MessageSquare size={40} className="mx-auto text-slate-400 mb-2"/>
                            <p>You have no active conversations.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Sub-component for a SINGLE CHAT ROOM ---
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
        if (!roomId) return;
        const channel = supabase.channel(`chat-room-${roomId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
            async (payload) => {
                // To avoid fetching the profile again, we can check if the sender is the current user
                if (payload.new.sender_id === user.id) return;
                const { data: sender } = await supabase.from('profiles').select('id, full_name').eq('id', payload.new.sender_id).single();
                setMessages(prev => [...prev, { ...payload.new, sender }]);
            }
        ).subscribe();
        return () => supabase.removeChannel(channel);
    }, [roomId, user.id]);

    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const tempId = Math.random();
        const newMessage = { id: tempId, content: input.trim(), sender: { id: user.id }, sent_at: new Date().toISOString() };
        setMessages(prev => [...prev, newMessage]);
        const currentInput = input;
        setInput("");
        try {
            await axiosInstance.post(`/chat/${roomId}/messages`, { content: currentInput.trim() }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {
            toast.error("Message failed to send.");
            setInput(currentInput); // Restore input on failure
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
    }, [input, roomId, token, user.id]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div className="w-full flex flex-col h-full">
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex flex-col overflow-y-auto">
                {isLoading ? <p className="m-auto text-slate-500">Loading chat history...</p> : messages.map((msg) => (
                    <div key={msg.id} className={`mb-3 px-4 py-2 rounded-2xl max-w-xs md:max-w-md break-words ${msg.sender?.id === user.id ? "bg-indigo-500 text-white self-end" : "bg-gray-100 dark:bg-slate-700 self-start"}`}>
                        <strong className="block text-sm opacity-70">{msg.sender?.id === user.id ? "You" : msg.sender?.full_name || '...'}</strong>
                        {msg.content}
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2 items-center">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 border rounded-xl p-3 bg-white dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3">Send</Button>
            </form>
        </div>
    );
}