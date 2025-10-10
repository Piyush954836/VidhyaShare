import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { MessageSquare } from 'lucide-react';

const Requests = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();
    const navigate = useNavigate();

    const fetchEnrollments = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            // This endpoint now fetches all enrollments (requested, enrolled, etc.)
            const { data } = await axiosInstance.get('/enrollments/incoming', {
                headers: { Authorization: `Bearer ${token}` },
            });
            // We only want to show students who are actively enrolled or have requested
            const activeEnrollments = (Array.isArray(data) ? data : []).filter(
                req => req.course && req.student && (req.status === 'enrolled' || req.status === 'requested')
            );
            setEnrollments(activeEnrollments);
        } catch (err) {
            toast.error("Failed to fetch student enrollments.");
            setEnrollments([]);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    const handleInitiateChat = async (studentId) => {
        if (!studentId) {
            toast.error("Student information is missing.");
            return;
        }
        try {
            const response = await axiosInstance.post('/chat/initiate', 
                { recipientId: studentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { roomId } = response.data;
            navigate(`/chat/${roomId}`);
        } catch (error) {
            toast.error(error.response?.data?.error || "Could not start chat.");
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <header className="px-4 md:px-8 pt-8 pb-6">
                    <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white shadow-md">
                        <h1 className="text-2xl md:text-4xl font-bold">Student Enrollments</h1>
                        <p className="mt-2 text-white/90">View and connect with students who have enrolled in your courses.</p>
                    </div>
                </header>

                <main className="px-4 md:px-8 pb-10 flex-1">
                    {isLoading ? <p className="text-center">Loading student list...</p> : enrollments.length === 0 ? (
                        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
                            <h3 className="text-xl font-semibold mb-2">No students have enrolled yet.</h3>
                            <p className="text-gray-600 dark:text-gray-300">When students enroll in your courses, they will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {enrollments.map((enrollment) => (
                                <Card key={enrollment.id} className="hover:-translate-y-1 transition-transform flex flex-col">
                                    <div className="flex-grow">
                                        <h2 className="font-bold text-lg">{enrollment.course.title}</h2>
                                        <div className="flex items-center gap-3 my-4">
                                            <img 
                                                src={enrollment.student.avatar_url || `https://i.pravatar.cc/150?u=${enrollment.student.id}`} 
                                                alt={enrollment.student.full_name} 
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
                                                <p className="font-semibold">{enrollment.student.full_name || 'Unknown User'}</p>
                                            </div>
                                        </div>
                                        <p className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                                            enrollment.status === "enrolled" ? "bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-200" :
                                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200"
                                        }`}>
                                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                                        <Button 
                                            onClick={() => handleInitiateChat(enrollment.student.id)} 
                                            className="w-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare size={16} /> Chat with Student
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Requests;