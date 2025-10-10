import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { Star } from 'lucide-react';

const PAGE_SIZE = 9;

const Explore = () => {
    const navigate = useNavigate();
    const { token } = useAuth(); // We still need the token for the API call

    // --- State updated for Courses ---
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("score-desc"); // Default sort is by quality
    const [page, setPage] = useState(1);

    // --- Data Fetching updated for Courses ---
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                // This points to the new backend logic that uses the RPC function.
                // It now sends the auth token so the backend can filter out the user's own courses.
                const res = await axiosInstance.get("/explore/courses", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                setCourses(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("[ERROR] Failed to fetch courses:", err);
                setError("Failed to fetch courses. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [token]); // Dependency on token ensures it re-fetches if user logs in/out

    // --- Categories are now derived from courses ---
    const categories = useMemo(() => {
        const set = new Set(courses.map((c) => c.skill?.category?.toLowerCase() || "uncategorized"));
        return ["all", ...Array.from(set).sort()];
    }, [courses]);

    // --- Filtering and Sorting logic for courses ---
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = courses.filter((course) => {
            const title = course.title || "";
            const teacher = course.teacher?.name || "";
            const skillName = course.skill?.name || "";
            const cat = course.skill?.category || "";
            
            const matchesQuery = !q || title.toLowerCase().includes(q) || teacher.toLowerCase().includes(q) || skillName.toLowerCase().includes(q);
            const matchesCat = category === "all" || cat.toLowerCase() === category;
            return matchesQuery && matchesCat;
        });

        switch (sortBy) {
            case "score-desc":
                list.sort((a, b) => (b.teaching_score || 0) - (a.teaching_score || 0));
                break;
            case "rating-desc":
                list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
                break;
            case "title-asc":
                list.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "title-desc":
                list.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                break;
        }
        return list;
    }, [courses, query, category, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const resetFilters = () => {
        setQuery("");
        setCategory("all");
        setSortBy("score-desc");
        setPage(1);
    };

    if (loading) return <div className="flex-1 flex items-center justify-center">Loading Courses...</div>;
    if (error) return <div className="flex-1 flex items-center justify-center text-red-600 p-4">Error: {error}</div>;

    return (
        <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />

                {/* --- Header Updated for Courses --- */}
                <header className="px-6 md:px-12 pt-10 pb-6">
                    <div className="rounded-3xl p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-wide">Explore Courses</h1>
                        <p className="mt-3 text-white/90 text-lg md:text-xl">Discover high-quality courses from verified teachers in our community.</p>
                    </div>
                </header>

                {/* --- Filters Updated for Courses --- */}
                <section className="px-6 md:px-12 pb-6 flex flex-col lg:flex-row gap-3 lg:items-center">
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder="Search by course, teacher, or skill..."
                        className="flex-1 rounded-2xl border px-5 py-3 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-2xl border px-4 py-3 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                        {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-2xl border px-4 py-3 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                        <option value="score-desc">Sort: Highest Quality</option>
                        <option value="rating-desc">Sort: Top Rated</option>
                        <option value="title-asc">Sort: Title A → Z</option>
                        <option value="title-desc">Sort: Title Z → A</option>
                    </select>
                    <Button onClick={resetFilters} className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white">Reset</Button>
                </section>

                {/* --- Course Grid --- */}
                <main className="px-6 md:px-12 pb-10 flex-1">
                    {filtered.length === 0 ? (
                        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
                            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {paged.map((course) => (
                                <Card 
                                    key={course.id}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition p-5 flex flex-col"
                                >
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h2>
                                            <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 flex-shrink-0">
                                                {course.skill.category || "General"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">A course on: <strong>{course.skill.name}</strong></p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t dark:border-gray-700">
                                        <img src={course.teacher.avatar_url || `https://i.pravatar.cc/150?u=${course.teacher.id}`} alt={course.teacher.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold text-sm">{course.teacher.name}</p>
                                            <div className="flex items-center gap-1 text-xs text-amber-500">
                                                <Star size={14} className="fill-current" />
                                                <span className="font-bold">{parseFloat(course.avg_rating).toFixed(1) || 'New'}</span>
                                            </div>
                                        </div>
                                        <span className="ml-auto px-2 py-1 text-xs font-bold rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                                            {course.teaching_score || 0} QS
                                        </span>
                                    </div>
                                     {/* ✨ NEW: Details Button */}
                                     <Button
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white"
                                    >
                                        View Details
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
                
                {/* --- Pagination Controls --- */}
                <footer className="px-6 md:px-12 pb-6 flex justify-center items-center gap-2">
                    <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <span className="font-medium">Page {page} of {totalPages}</span>
                    <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </footer>
            </div>
        </div>
    );
};

export default Explore;