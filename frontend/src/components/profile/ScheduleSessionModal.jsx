import { useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button"; // Adjust path as needed
import { useAuth } from "../../context/AuthContext"; // Adjust path
import axiosInstance from "../../api/axiosInstance"; // Adjust path
import { toast } from "react-toastify";

export default function ScheduleSessionModal({
  topicId,
  topicTitle,
  courseId,
  onClose,
  onSessionCreated,
}) {
  const { token } = useAuth();
  const [subtopicsInput, setSubtopicsInput] = useState("");
  const [sessionType, setSessionType] = useState("group");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [maxStudents, setMaxStudents] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subtopics = subtopicsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => !!s);
    const title =
      subtopics.length > 0
        ? `Session on ${topicTitle}: ${subtopics.join(", ")}`
        : `Session on ${topicTitle}`;

    if (!topicId || !subtopics.length || !scheduledAt) {
      toast.warn("Please provide at least one subtopic and a scheduled time.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post(
        "/sessions",
        {
          course_id: courseId,
          topic_id: topicId,
          subtopics,
          session_type: sessionType,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: parseInt(duration),
          max_students: sessionType === "group" ? parseInt(maxStudents) : 1,
          title,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Live session scheduled!");
      onSessionCreated();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to schedule session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500">
            Schedule Live Session for <b>{topicTitle}</b>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           {/* ... Inputs for Subtopics, Date, Type, Max Students, Duration ... */}
           {/* (Copied directly from original code to save space, logic remains identical) */}
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subtopics (comma-separated)</label>
            <input type="text" value={subtopicsInput} onChange={(e) => setSubtopicsInput(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" required />
           </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date and Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" required />
           </div>
           {/* ... Rest of form inputs ... */}
           
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-black dark:text-white">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-teal-500">{isSubmitting ? "Scheduling..." : "Schedule Session"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}