import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/ui/Button';
import { Plus, Sparkles, LoaderCircle } from 'lucide-react';

const AdminTests = () => {
    const { token } = useAuth();
    const [tests, setTests] = useState([]);
    const [skills, setSkills] = useState([]);
    const [newTest, setNewTest] = useState({
        skill_id: '',
        level: 'Beginner',
        type: 'Algorithm',
        title: '',
        details: '',
        evaluation_criteria: ''
    });
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [testsRes, skillsRes] = await Promise.all([
                    axiosInstance.get('/tests', { headers: { Authorization: `Bearer ${token}` } }),
                    axiosInstance.get('/skills', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setTests(testsRes.data);
                setSkills(skillsRes.data);
            } catch (err) {
                toast.error("Failed to fetch initial data.");
            }
        };
        fetchData();
    }, [token]);

    const handleAIGenerate = async () => {
        if (!newTest.skill_id || !newTest.level || !newTest.type) {
            return toast.warn("Please select a Skill, Level, and Type first.");
        }
        
        setIsGenerating(true);
        try {
            const selectedSkill = skills.find(s => s.id === parseInt(newTest.skill_id));
            if (!selectedSkill) {
                toast.error("Selected skill not found.");
                setIsGenerating(false);
                return;
            }
            
            const res = await axiosInstance.post('/tests/generate-ai', {
                skillName: selectedSkill.name,
                level: newTest.level,
                type: newTest.type,
                topic: aiTopic,
            }, { headers: { Authorization: `Bearer ${token}` } });

            setNewTest(prev => ({
                ...prev,
                title: prev.title || res.data.details.problem_statement?.substring(0, 50) || 'AI Generated Test',
                details: JSON.stringify(res.data.details, null, 2),
                evaluation_criteria: JSON.stringify(res.data.evaluation_criteria, null, 2),
            }));
            toast.success("AI content generated successfully!");

        } catch (err) {
            toast.error(err.response?.data?.error || "AI generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddTest = async (e) => {
        e.preventDefault();
        try {
            // Check if details and criteria are not empty
            if (!newTest.details || !newTest.evaluation_criteria) {
                return toast.error("Details and Evaluation Criteria cannot be empty. Please generate content first.");
            }
            const parsedDetails = JSON.parse(newTest.details);
            const parsedCriteria = JSON.parse(newTest.evaluation_criteria);
            
            await axiosInstance.post('/tests', { ...newTest, details: parsedDetails, evaluation_criteria: parsedCriteria }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Test created successfully!");
        } catch (err) {
            if (err instanceof SyntaxError) {
                toast.error("Invalid JSON in Details or Evaluation Criteria.");
            } else {
                toast.error(err.response?.data?.error || "Failed to create test.");
            }
        }
    };
    
    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900">
            <Sidebar />
            {/* ✨ FIXED: Removed 'md:ml-64' to correct the layout alignment */}
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 px-4 md:px-10 py-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <h1 
                            className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-sky-400 dark:to-cyan-400"
                            style={{ opacity: 0, animation: 'fade-in-up 0.5s ease-out forwards' }}
                        >
                            Admin: Manage Tests
                        </h1>
                        
                        <div 
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-700"
                            style={{ opacity: 0, animation: 'fade-in-up 0.5s ease-out 100ms forwards' }}
                        >
                            <form onSubmit={handleAddTest} className="space-y-8">
                                
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-600 pb-2 mb-4">1. Define Test Parameters</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" placeholder="Test Title" value={newTest.title} onChange={e => setNewTest({...newTest, title: e.target.value})} className="p-3 border-2 border-slate-200 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                                        <select value={newTest.skill_id} onChange={e => setNewTest({...newTest, skill_id: e.target.value})} className="p-3 border-2 border-slate-200 dark:text-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                                            <option value="">-- Select Skill --</option>
                                            {skills.map(skill => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
                                        </select>
                                        <select value={newTest.level} onChange={e => setNewTest({...newTest, level: e.target.value})} className="p-3 border-2 border-slate-200 dark:text-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                                            <option>Beginner</option> <option>Intermediate</option> <option>Advanced</option>
                                        </select>
                                        <select value={newTest.type} onChange={e => setNewTest({...newTest, type: e.target.value})} className="p-3 border-2 border-slate-200 dark:text-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                                            <option>Algorithm</option> <option>SQL</option> <option>Project</option> <option>Design</option> <option>Development</option> <option>DevOps</option> <option>Scenario</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-600 pb-2 mb-4">2. Generate Content with AI</h3>
                                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex flex-col md:flex-row items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder="Optional: Specific topic (e.g., 'array manipulation')"
                                            value={aiTopic}
                                            onChange={e => setAiTopic(e.target.value)}
                                            className="p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg w-full bg-white dark:bg-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        />
                                        <Button type="button" onClick={handleAIGenerate} disabled={isGenerating} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white w-full md:w-auto shrink-0">
                                            <div className="flex items-center justify-center gap-2 px-4 py-1">
                                                {isGenerating ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                                            </div>
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                     <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-600 pb-2 mb-4">3. Review & Save</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <textarea placeholder="Details (JSON will be generated here)" value={newTest.details} onChange={e => setNewTest({...newTest, details: e.target.value})} className="p-3 border-2 border-slate-200 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:border-slate-600 rounded-lg h-40 bg-transparent dark:bg-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
                                        <textarea placeholder="Evaluation Criteria (JSON will be generated here)" value={newTest.evaluation_criteria} onChange={e => setNewTest({...newTest, evaluation_criteria: e.target.value})} className="p-3 border-2 border-slate-200 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:border-slate-600 rounded-lg h-40 bg-transparent dark:bg-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-slate-700 to-slate-900 dark:from-blue-500 dark:to-purple-500 hover:shadow-lg hover:shadow-slate-500/40 dark:hover:shadow-purple-500/40 text-white font-bold transition-all duration-300 transform hover:-translate-y-px flex items-center justify-center gap-2 py-3">
                                    <Plus className="w-5 h-5" /> Create & Save Test
                                </Button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminTests;