import { useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button"; // Adjust path if needed
import { useAuth } from "../../context/AuthContext"; // Adjust path if needed
import axiosInstance from "../../api/axiosInstance"; // Adjust path if needed
import { toast } from "react-toastify";

export default function AddTopicModal({ courseId, onClose, onTopicAdded }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warn("Please enter a topic title.");
      return;
    }

    setIsSubmitting(true);
    try {
      // API call to create a topic
      await axiosInstance.post(
        `/courses/${courseId}/topics`,
        {
          course_id: courseId,
          title: title.trim(),
          topic_order: order ? parseInt(order) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Topic added successfully!");
      onTopicAdded(); // Trigger refresh in parent
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to add topic.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-600">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Add New Topic
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
              Topic Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Functions"
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sequence Order (Optional)
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="e.g. 1"
              min="1"
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              If left blank, it will be added to the end.
            </p>
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? "Adding..." : "Add Topic"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}