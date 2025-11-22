import { useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button"; // Adjust path to your Button component
import { useAuth } from "../../context/AuthContext"; // Adjust path
import axiosInstance from "../../api/axiosInstance"; // Adjust path
import { toast } from "react-toastify";

export default function CreateCourseModal({ onClose, onCourseCreated, availableSkills }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !selectedSkillId) {
      toast.warn("Please fill in all fields and select a skill.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post(
        "/courses",
        {
          title: title.trim(),
          description: description.trim(),
          skill_id: selectedSkillId,
          level: difficulty,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Course created successfully!");
      onCourseCreated();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn">
        <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            Create New Course
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced React Patterns"
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Related Skill
            </label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              required
            >
              <option value="" disabled>
                -- Choose a Skill you possess --
              </option>
              {availableSkills.map((s) => (
                <option key={s.id} value={s.skill_id}>
                  {s.name || s.skills?.name} ({s.level})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You can only create courses for skills you have added to your profile.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="What will students learn in this course?"
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-600 text-black dark:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}