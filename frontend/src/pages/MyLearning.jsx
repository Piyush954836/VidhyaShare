import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { Book, Check, Clock } from 'lucide-react';

export default function MyLearning() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMyLearning = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/enrollments/my-learning', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrollments(response.data || []);
        } catch (error) {
            toast.error("Could not load your courses.");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMyLearning();
    }, [fetchMyLearning]);

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        <header className="mb-8">
                            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">My Learning</h1>
                            <p className="mt-2 text-slate-600 dark:text-slate-400">All your requested and enrolled courses in one place.</p>
                        </header>
                        
                        {isLoading ? (
                            <p className="text-center">Loading your courses...</p>
                        ) : (
                            <div className="space-y-4">
                                {enrollments.length > 0 ? enrollments.map(({ course, status }) => (
                                    <div 
                                        key={course.id} 
                                        className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                                    >
                                        <div className="flex-grow">
                                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{course.title}</h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Taught by {course.teacher.full_name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            {status === 'requested' && (
                                                <span className="text-sm font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300 py-1 px-3 rounded-full flex items-center gap-2">
                                                    <Clock size={16} /> Requested
                                                </span>
                                            )}
                                            {status === 'enrolled' && (
                                                <span className="text-sm font-bold bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300 py-1 px-3 rounded-full flex items-center gap-2">
                                                    <Check size={16} /> Enrolled
                                                </span>
                                            )}
                                            <button 
                                                onClick={() => navigate(`/courses/${course.id}`)}
                                                className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                                            >
                                                Go to Course
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-slate-500 py-16 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed">
                                        <Book size={48} className="mx-auto text-slate-400 mb-4" />
                                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Your learning path is empty.</h3>
                                        <p className="mt-2">Explore courses to start your journey!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}