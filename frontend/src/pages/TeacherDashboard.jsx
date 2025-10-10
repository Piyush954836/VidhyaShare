import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance'; // Ensure this path is correct
import { toast } from 'react-toastify';
import QuizGenerator from "../components/QuizGenerator"; // Your existing quiz component

// --- Main Page Component ---
export default function TeacherDashboard() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadCourses = useCallback(async () => {
        setIsLoading(true);
        try {
            // You will need to create this endpoint in your backend
            // It should fetch all courses where teacher_id matches the logged-in user
            const response = await axiosInstance.get('/api/courses/my-courses');
            setCourses(response.data);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            toast.error("Failed to load your courses.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    // This function will be passed down to the editor to refresh the main list
    const handleCourseUpdate = () => {
        setSelectedCourse(null);
        loadCourses();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (selectedCourse) {
        return <CourseEditor course={selectedCourse} onBack={handleCourseUpdate} />;
    }

    return (
        <div className="bg-slate-100 min-h-screen">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                    <h1 className="text-4xl font-bold text-slate-800">My Courses</h1>
                    <button 
                        className="bg-indigo-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105"
                        // onClick={() => {/* Logic to open a 'Create New Course' modal */}}
                    >
                        + Create New Course
                    </button>
                </header>
                
                <main className="space-y-4">
                    {courses.length > 0 ? courses.map(course => (
                        <div 
                            key={course.id}
                            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all"
                            onClick={() => setSelectedCourse(course)}
                        >
                            <div className="flex-grow">
                                <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
                                {/* Assuming your /my-courses endpoint joins with skills table */}
                                <p className="text-sm text-slate-500">Skill: {course.skill?.name || 'N/A'}</p>
                            </div>
                            <div className="flex-shrink-0">
                                {course.is_verified ? (
                                    <span className="text-sm font-bold bg-green-100 text-green-800 py-1 px-4 rounded-full flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Verified
                                    </span>
                                ) : (
                                    <span className="text-sm font-bold bg-yellow-100 text-yellow-800 py-1 px-4 rounded-full flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                        In Progress
                                    </span>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-slate-500 py-16 bg-white rounded-xl border border-dashed">
                            <h3 className="text-xl font-semibold text-slate-700">No Courses Found</h3>
                            <p className="mt-2">Click "Create New Course" to get started.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// --- Course Editor Component ---
function CourseEditor({ course, onBack }) {
    const [topics, setTopics] = useState([]);
    const [isLoadingTopics, setIsLoadingTopics] = useState(true);
    const [newTopicTitle, setNewTopicTitle] = useState('');

    const fetchTopics = useCallback(async () => {
        setIsLoadingTopics(true);
        try {
            // This endpoint should fetch topics and their verification status for the current teacher
            const response = await axiosInstance.get(`/api/courses/${course.id}/topics`);
            setTopics(response.data);
        } catch (error) {
            console.error(`Failed to fetch topics for course ${course.id}:`, error);
            toast.error("Could not load topics for this course.");
        } finally {
            setIsLoadingTopics(false);
        }
    }, [course.id]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    const handleAddTopic = async (e) => {
        e.preventDefault();
        if (!newTopicTitle) return;
        try {
            await axiosInstance.post(`/api/courses/${course.id}/topics`, {
                title: newTopicTitle,
                topic_order: topics.length + 1,
            });
            toast.success("Topic added!");
            setNewTopicTitle('');
            fetchTopics(); // Refresh the list
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add topic.");
        }
    };

    const handleVerifyCourse = async () => {
        try {
            const response = await axiosInstance.post(`/api/courses/${course.id}/verify`);
            toast.success(response.data.message);
            onBack(); // Go back to the dashboard and refresh
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Final verification failed.";
            const unverified = error.response?.data?.unverified_topics;
            toast.error(<div><p>{errorMessage}</p>{unverified && <p>Remaining: {unverified.join(', ')}</p>}</div>);
        }
    };
    
    const allTopicsVerified = !isLoadingTopics && topics.length > 0 && topics.every(t => t.is_verified);

    return (
        <div className="bg-slate-100 min-h-screen">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
                <header className="mb-6">
                    <button onClick={onBack} className="text-indigo-600 font-semibold mb-4 hover:underline">&larr; Back to Dashboard</button>
                    <h1 className="text-4xl font-bold text-slate-800">{course.title}</h1>
                    <p className="text-slate-600 mt-2">Add topics to your curriculum. You must pass a verification quiz for each topic before the course can be published.</p>
                </header>

                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Add New Topic</h2>
                    <form onSubmit={handleAddTopic} className="flex flex-col sm:flex-row gap-3 mb-8">
                        <input
                            type="text"
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            placeholder="e.g., Variables and Data Types"
                            className="flex-grow w-full p-3 border-2 border-slate-200 rounded-md focus:border-indigo-500 focus:ring-indigo-500 transition"
                        />
                        <button type="submit" className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-indigo-700 transition">
                            Add Topic
                        </button>
                    </form>

                    <h2 className="text-xl font-semibold text-slate-700 mb-4 border-t border-slate-200 pt-6">Curriculum Topics</h2>
                    {isLoadingTopics ? <p>Loading topics...</p> : (
                        <div className="space-y-3 mb-8">
                            {topics.map(topic => (
                                <TopicItem key={topic.id} topic={topic} onVerificationComplete={fetchTopics} />
                            ))}
                        </div>
                    )}

                    <div className="text-center border-t border-slate-200 pt-6">
                        <button
                            onClick={handleVerifyCourse}
                            disabled={!allTopicsVerified}
                            className={`w-full sm:w-auto font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${
                                allTopicsVerified 
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            Publish Course
                        </button>
                        {!allTopicsVerified && topics.length > 0 && <p className="text-sm text-slate-500 mt-2">All topics must be verified before you can publish.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- Topic Item Sub-Component ---
function TopicItem({ topic, onVerificationComplete }) {
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [isStartingQuiz, setIsStartingQuiz] = useState(false);

    const handleStartQuiz = async () => {
        setIsStartingQuiz(true);
        try {
            const response = await axiosInstance.post(`/api/quiz/topic/${topic.id}/start-verification`);
            setQuizData(response.data);
            setIsQuizOpen(true);
        } catch (error) {
            toast.error(error.response?.data?.error || "Could not start the verification quiz.");
        } finally {
            setIsStartingQuiz(false);
        }
    };
    
    const handleQuizFinish = (result) => {
        setIsQuizOpen(false);
        setQuizData(null);
        toast.info(result.message); // Show pass/fail message from backend
        onVerificationComplete(); // Refresh the topics list
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-lg border border-slate-200 gap-3">
                <p className="font-medium text-slate-800">
                    <span className="font-bold text-slate-400">{topic.topic_order}.</span> {topic.title}
                </p>
                {topic.is_verified ? (
                    <span className="text-xs font-bold bg-green-100 text-green-800 py-1 px-3 rounded-full flex-shrink-0">
                        ✅ Verified
                    </span>
                ) : (
                    <button 
                        onClick={handleStartQuiz}
                        disabled={isStartingQuiz}
                        className="bg-indigo-100 text-indigo-800 font-semibold py-1 px-4 rounded-full text-xs hover:bg-indigo-200 transition flex-shrink-0 disabled:opacity-50"
                    >
                        {isStartingQuiz ? 'Generating...' : 'Verify Topic'}
                    </button>
                )}
            </div>

            {isQuizOpen && (
                <QuizGenerator 
                    // Pass the quiz data directly
                    skill={{ name: topic.title, id: topic.id }}
                    quizDataFromParent={quizData} 
                    // Adapt onQuizSubmit to pass topic_id
                    onQuizSubmit={async (score, totalQuestions) => {
                        const response = await axiosInstance.post('/api/quiz/save-result', {
                            score,
                            totalQuestions,
                            topic_id: topic.id,
                        });
                        handleQuizFinish(response.data);
                    }}
                    onClose={() => setIsQuizOpen(false)} 
                />
            )}
        </>
    );
}