import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Search, Edit, Trash2, Plus } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Admin = () => {
    const { token } = useAuth();
    const [skills, setSkills] = useState([]);
    const [filteredSkills, setFilteredSkills] = useState([]);
    const [newSkill, setNewSkill] = useState({ name: '', category: '' });
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSkills = async () => {
        if (!token) return;
        try {
            const res = await axiosInstance.get('/skills', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSkills(res.data);
        } catch (err) {
            toast.error('Failed to fetch skills. You may not be authorized.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [token]);

    useEffect(() => {
        setFilteredSkills(
            skills.filter(skill =>
                skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                skill.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, skills]);

    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (!newSkill.name || !newSkill.category) {
            return toast.warn('Please provide both name and category.');
        }
        try {
            await axiosInstance.post('/skills', newSkill, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(`Skill "${newSkill.name}" added successfully!`);
            setNewSkill({ name: '', category: '' });
            fetchSkills();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add skill.');
        }
    };
    
    const handleDeleteSkill = async (skillId, skillName) => {
        if (window.confirm(`Are you sure you want to delete "${skillName}"? This will remove it from all users.`)) {
            try {
                await axiosInstance.delete(`/skills/${skillId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success(`Skill "${skillName}" deleted.`);
                fetchSkills();
            } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to delete skill.');
            }
        }
    };

    const handleOpenEditModal = (skill) => {
        setEditingSkill(skill);
        setIsEditModalOpen(true);
    };

    const handleUpdateSkill = async (e) => {
        e.preventDefault();
        if (!editingSkill || !editingSkill.name || !editingSkill.category) {
            return toast.warn('Name and category cannot be empty.');
        }
        try {
            await axiosInstance.put(`/skills/${editingSkill.id}`, {
                name: editingSkill.name,
                category: editingSkill.category
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Skill updated successfully!');
            setIsEditModalOpen(false);
            setEditingSkill(null);
            fetchSkills();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update skill.');
        }
    };

     return (
        <div className="min-h-screen flex bg-slate-100 dark:bg-gray-900">
            <Sidebar />
            {/* ✨ FIXED: Removed 'md:ml-64' to correct the right-shifted layout */}
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 px-4 md:px-10 py-8 overflow-y-auto">
                    <h1 
                        className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-sky-400 dark:to-cyan-400"
                        style={{ opacity: 0, animation: 'fade-in-up 0.5s ease-out forwards' }}
                    >
                        Admin: Manage Skills
                    </h1>

                    {/* ✨ UPDATED: Add Skill Form with new theme */}
                    <div 
                        className="mb-10 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
                        style={{ opacity: 0, animation: 'fade-in-up 0.5s ease-out 100ms forwards' }}
                    >
                        <h2 className="text-2xl font-semibold mb-5 text-slate-800 dark:text-slate-100">Add New Skill</h2>
                        <form onSubmit={handleAddSkill} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <input
                                type="text"
                                placeholder="Skill Name (e.g., React)"
                                value={newSkill.name}
                                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                className="md:col-span-1 px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            <input
                                type="text"
                                placeholder="Category (e.g., Frontend)"
                                value={newSkill.category}
                                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                                className="md:col-span-1 px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            <Button type="submit" className="md:col-span-1 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-blue-500 dark:to-purple-500 hover:shadow-lg hover:shadow-slate-500/40 dark:hover:shadow-purple-500/40 text-white font-bold transition-all duration-300 transform hover:-translate-y-px flex items-center justify-center gap-2 py-3">
                                <Plus className="w-5 h-5" /> Add Skill
                            </Button>
                        </form>
                    </div>

                    {/* ✨ UPDATED: Skills Table with new theme */}
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
                        style={{ opacity: 0, animation: 'fade-in-up 0.5s ease-out 200ms forwards' }}
                    >
                         <div className="flex flex-col md:flex-row justify-between md:items-center mb-5 gap-4">
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Existing Skills</h2>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search skills..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full md:w-72"
                                />
                            </div>
                         </div>
                        {loading ? <p className="text-center p-8 text-slate-500">Loading skills...</p> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Category</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSkills.length > 0 ? filteredSkills.map((skill, index) => (
                                            <tr 
                                                key={skill.id} 
                                                className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
                                                style={{ animation: 'fade-in-up 0.5s ease-out forwards', animationDelay: `${index * 50}ms`, opacity: 0 }}
                                            >
                                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{skill.name}</td>
                                                <td className="p-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{skill.category}</td>
                                                <td className="p-4 text-right space-x-2">
                                                    <Button onClick={() => handleOpenEditModal(skill)} className="bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 text-xs p-2 transition-transform transform hover:scale-110">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={() => handleDeleteSkill(skill.id, skill.name)} className="bg-red-500 text-red-700 hover:bg-red-300 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800 text-xs p-2 transition-transform transform hover:scale-110">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="3" className="text-center p-8 text-slate-500 dark:text-slate-400">No skills found matching your search.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {isEditModalOpen && editingSkill && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Skill">
                    <form onSubmit={handleUpdateSkill} className="flex flex-col gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Skill Name</label>
                            <input
                                type="text"
                                value={editingSkill.name}
                                onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Category</label>
                            <input
                                type="text"
                                value={editingSkill.category}
                                onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Admin;