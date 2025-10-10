import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import axios from "axios";

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";

const MySkills = () => {
  const { token, refreshUser } = useAuth();
  const [userSkills, setUserSkills] = useState([]); // User's currently added skills
  
  // ✨ NEW: State to hold all skills available on the platform
  const [availableSkills, setAvailableSkills] = useState([]);
  
  // ✨ UPDATED: State to hold the ID of the selected skill and level
  const [newSkill, setNewSkill] = useState({ skill_id: "", level: "" });

  const [openModal, setOpenModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ✨ UPDATED: Fetch both user's skills and all available skills
  useEffect(() => {
    if (!token) return;
    
    const fetchUserSkills = async () => {
      try {
        const res = await axios.get(`${API_BASE}/user-skills`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserSkills(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("[ERROR] fetchUserSkills:", err);
        alert(err.response?.data?.error || "Failed to fetch your skills");
      }
    };

    const fetchAvailableSkills = async () => {
      try {
        const res = await axios.get(`${API_BASE}/skills`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableSkills(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("[ERROR] fetchAvailableSkills:", err);
        alert(err.response?.data?.error || "Failed to fetch available skills");
      }
    };

    fetchUserSkills();
    fetchAvailableSkills();
  }, [token]);

  // ✨ UPDATED: Simplified logic for adding a skill from the dropdown
  const handleAddSkill = async () => {
    const { skill_id, level } = newSkill;
    if (!skill_id || !level) {
      return alert("Please select a skill and a level");
    }

    try {
      // Only one API call is needed now to link the skill to the user
      await axios.post(
        `${API_BASE}/user-skills`,
        { skill_id: parseInt(skill_id), level }, // Ensure skill_id is an integer
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewSkill({ skill_id: "", level: "" });
      
      // Re-fetch only the user's skills after adding one
      const res = await axios.get(`${API_BASE}/user-skills`, { headers: { Authorization: `Bearer ${token}` } });
      setUserSkills(Array.isArray(res.data) ? res.data : []);
      refreshUser(); // Refresh global user state if needed for point totals, etc.
    } catch (err) {
      console.error("[ERROR] handleAddSkill:", err);
      alert(err.response?.data?.error || "Failed to add skill. You may already have this skill.");
    }
  };

  const handleDelete = (userSkillId) => {
    setSelectedSkill(userSkillId);
    setOpenModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSkill) return;

    try {
      await axios.delete(`${API_BASE}/user-skills/${selectedSkill}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOpenModal(false);
      setSelectedSkill(null);
      // Re-fetch user skills after deletion
      const res = await axios.get(`${API_BASE}/user-skills`, { headers: { Authorization: `Bearer ${token}` } });
      setUserSkills(Array.isArray(res.data) ? res.data : []);
      refreshUser();
    } catch (err) {
      console.error("[ERROR] confirmDelete:", err);
      alert(err.response?.data?.error || "Failed to delete skill");
    }
  };

  // Helper to find the selected skill's category for display
  const selectedSkillCategory = availableSkills.find(s => s.id === parseInt(newSkill.skill_id))?.category || 'Category will appear here';

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="px-6 py-8">
          <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            My Skills
          </h1>

          {/* ✨ UPDATED: Add Skill Form now uses dropdowns */}
          <div className="max-w-3xl mx-auto mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <select
              value={newSkill.skill_id}
              onChange={(e) => setNewSkill({ ...newSkill, skill_id: e.target.value })}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            >
              <option value="">-- Select a Skill --</option>
              {availableSkills.map(skill => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
            
            <input
              type="text"
              readOnly
              value={capitalize(selectedSkillCategory)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400 cursor-not-allowed"
            />

            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            >
              <option value="">-- Select Level --</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-lg"
              onClick={handleAddSkill}
            >
              Add Skill
            </Button>
          </div>

          {/* List User's Skills */}
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {userSkills.map((s) => {
              const points = s.points || 0;
              const percentage = Math.min(points / 10, 100); // Example: 1000 points = 100%

              return (
                <div
                  key={s.id}
                  className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-2xl p-5 flex flex-col justify-between shadow-md"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-bold text-lg text-indigo-700 dark:text-indigo-400">
                        {capitalize(s.name)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {capitalize(s.category)} | Level:{" "}
                        <span className="font-semibold">
                          {capitalize(s.level)}
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDelete(s.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-1 text-right text-gray-700 dark:text-gray-300 font-medium">
                    Points: {points}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={openModal}
            onClose={() => setOpenModal(false)}
            title="Delete Skill"
          >
            <p>Are you sure you want to delete this skill?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Delete
              </Button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
};

export default MySkills;