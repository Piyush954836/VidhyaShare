import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  Zap,
  Clock,
  Code,
  BookOpen,
  ChevronLeft,
  X,
  Video,
} from "lucide-react";
import QuizGenerator from "../components/QuizGenerator";
import PracticalTestModal from "../components/PracticalTestModal";
import LiveSession from "./LiveSession";

// --- Reusable Countdown Timer Component ---
const CountdownTimer = ({ expiryTimestamp }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = +new Date(expiryTimestamp) - +new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }, [expiryTimestamp]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const formatTime = (value) => String(value).padStart(2, "0");

  return (
    <div className="w-full mt-4 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold py-2 px-4 rounded-lg">
      <Clock className="w-4 h-4" />
      {Object.keys(timeLeft).length ? (
        <span>
          Next attempt in {formatTime(timeLeft.hours)}:
          {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
        </span>
      ) : (
        <span>Cooldown finished. Please refresh.</span>
      )}
    </div>
  );
};

// --- Create Course Modal Component ---
const CreateCourseModal = ({ onClose, onCourseCreated }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillId, setSkillId] = useState("");
  const [availableSkills, setAvailableSkills] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await axiosInstance.get("/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableSkills(response.data || []);
      } catch (error) {
        toast.error("Could not load available skills.");
      }
    };
    fetchSkills();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !skillId) {
      toast.warn("Please select a skill and provide a title.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "/courses",
        {
          skill_id: parseInt(skillId),
          title,
          description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      onCourseCreated();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-lg text-gray-900 dark:text-gray-100">
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
            <label htmlFor="skill" className="block mb-2 font-medium">
              Select Skill to Teach
            </label>
            <select
              id="skill"
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full p-3 border-2 rounded-md bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500"
            >
              <option value="" disabled>
                -- Select a Skill --
              </option>
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block mb-2 font-medium">
              Course Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Ultimate Guide to JavaScript"
              className="w-full p-3 border-2 rounded-md bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-2 font-medium">
              Course Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="A brief summary of what students will learn."
              className="w-full p-3 border-2 rounded-md bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500"
            ></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
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
              className="bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ✨ --- NEW: Schedule Session Modal Component (was missing) ---
function ScheduleSessionModal({ courseId, onClose, onSessionCreated }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState("group");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [maxStudents, setMaxStudents] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !scheduledAt) {
      toast.warn("Please provide a title and a scheduled time.");
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.post(
        "/sessions",
        {
          course_id: courseId,
          title,
          session_type: sessionType,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: parseInt(duration),
          max_students: sessionType === "group" ? parseInt(maxStudents) : 1,
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
            Schedule Live Session
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="session-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Title
            </label>
            <input
              id="session-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label
              htmlFor="session-datetime"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Date and Time
            </label>
            <input
              id="session-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label
              htmlFor="session-type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Session Type
            </label>
            <select
              id="session-type"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="group">Group Session</option>
              <option value="one_on_one">One-on-One</option>
            </select>
          </div>
          {sessionType === "group" && (
            <div>
              <label
                htmlFor="max-students"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Max Students
              </label>
              <input
                id="max-students"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                min="2"
                className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="10"
              className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
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
              className="bg-gradient-to-r from-green-500 to-teal-500"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Profile Page Component ---
const Profile = () => {
  const { user, token, refreshUser } = useAuth();

  // --- State Management ---
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [skills, setSkills] = useState([]);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedSkillForQuiz, setSelectedSkillForQuiz] = useState(null);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [selectedSkillForTest, setSelectedSkillForTest] = useState(null);
  const [view, setView] = useState("skills");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // --- Data Fetching ---
  const fetchProfileData = useCallback(async () => {
    if (!user || !token) return;
    try {
      const profileRes = await axiosInstance.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = profileRes.data || {};
      setName(profile.full_name?.trim() || "User");
      setBio(profile.bio?.trim() || "");
      setProfilePic(profile.avatar_url?.trim());
      const skillsRes = await axiosInstance.get("/user-skills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);
    } catch (err) {
      toast.error("Failed to load profile data.");
    }
  }, [user, token]);

  const fetchCourses = useCallback(async () => {
    if (!user || !token) return;
    setIsLoadingCourses(true);
    try {
      const response = await axiosInstance.get("/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data || []);
    } catch (error) {
      toast.error("Failed to load your courses.");
    } finally {
      setIsLoadingCourses(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (view === "teaching") {
      fetchCourses();
    }
  }, [view, fetchCourses]);

  // --- Event Handlers ---
  const handleSave = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", name.trim());
      formData.append("bio", bio.trim());
      const file = fileInputRef.current?.files[0];
      if (file) formData.append("avatar", file);
      await axiosInstance.put("/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated successfully!");
      setEditing(false);
      refreshUser();
      fetchProfileData();
    } catch (err) {
      toast.error(
        "Failed to update profile: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setUploading(false);
    }
  };
  const handleStartVerification = (skill) => {
    setIsQuizOpen(true);
    setSelectedSkillForQuiz(skill);
  };
  const handleQuizCompletion = () => {
    setIsQuizOpen(false);
    setSelectedSkillForQuiz(null);
    fetchProfileData();
  };
  const handleStartTest = (skill) => {
    setIsTestOpen(true);
    setSelectedSkillForTest(skill);
  };
  const handleTestCompletion = () => {
    setIsTestOpen(false);
    setSelectedSkillForTest(null);
    fetchProfileData();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // --- RENDER LOGIC ---
  return (
    <>
      {activeSession && (
        <LiveSession
          session={activeSession}
          onClose={() => setActiveSession(null)}
        />
      )}
      {isCreateCourseOpen && (
        <CreateCourseModal
          onClose={() => setIsCreateCourseOpen(false)}
          onCourseCreated={() => {
            setIsCreateCourseOpen(false);
            fetchCourses();
          }}
        />
      )}
      {isQuizOpen && selectedSkillForQuiz && (
        <QuizGenerator
          skill={selectedSkillForQuiz}
          onClose={() => setIsQuizOpen(false)}
          onVerificationComplete={handleQuizCompletion}
        />
      )}
      {isTestOpen && selectedSkillForTest && (
        <PracticalTestModal
          userSkill={selectedSkillForTest}
          onClose={() => setIsTestOpen(false)}
          onTestComplete={handleTestCompletion}
        />
      )}

      <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 px-4 md:px-10 py-8 overflow-y-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Profile
            </h1>

            {!editing ? (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                  <img
                    key={profilePic}
                    src={profilePic || `https://i.pravatar.cc/150?u=${user.id}`}
                    alt={name || "User"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://i.pravatar.cc/150?u=${user.id}`;
                    }}
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-300 dark:border-indigo-500"
                  />
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {name || "User"}
                    </h2>
                    {bio && (
                      <p className="mt-2 text-gray-700 dark:text-gray-200 max-w-xl mx-auto md:mx-0">
                        {bio}
                      </p>
                    )}
                    <div className="mt-6">
                      <Button
                        onClick={() => setEditing(true)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500"
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                      onClick={() => setView("skills")}
                      className={`flex items-center gap-2 py-3 px-4 font-semibold transition ${
                        view === "skills"
                          ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <Zap className="w-5 h-5" /> My Skills
                    </button>
                    <button
                      onClick={() => setView("teaching")}
                      className={`flex items-center gap-2 py-3 px-4 font-semibold transition ${
                        view === "teaching"
                          ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <BookOpen className="w-5 h-5" /> Teaching
                    </button>
                  </div>

                  {view === "skills" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {skills.map((s) => {
                        const MAX_ATTEMPTS = 3;
                        const attemptsLeft =
                          MAX_ATTEMPTS - (s.attempt_count || 0);
                        const isOnCooldown =
                          s.cooldown_until &&
                          new Date(s.cooldown_until) > new Date();
                        return (
                          <div
                            key={s.id}
                            className="p-4 rounded-xl shadow-md bg-slate-50 dark:bg-slate-700/50 flex flex-col justify-between transition-shadow hover:shadow-lg"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                                  {s.name}
                                </h3>
                                {s.is_verified && (
                                  <div className="flex items-center text-xs bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                                    <ShieldCheck className="w-4 h-4 mr-1" />{" "}
                                    Verified
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Category: {s.category} | Level: {s.level}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-300">
                                Points: {s.points || 0}
                              </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                              {!s.is_verified ? (
                                isOnCooldown ? (
                                  <CountdownTimer
                                    expiryTimestamp={s.cooldown_until}
                                  />
                                ) : (
                                  <div className="text-center">
                                    <button
                                      onClick={() => handleStartVerification(s)}
                                      className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-transform transform hover:scale-105"
                                    >
                                      <Zap className="w-4 h-4" /> Verify Skill
                                      (Quiz)
                                    </button>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                      {attemptsLeft} of {MAX_ATTEMPTS} attempts
                                      remaining
                                    </p>
                                  </div>
                                )
                              ) : (
                                s.level !== "Advanced" && (
                                  <button
                                    onClick={() => handleStartTest(s)}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                                  >
                                    <Code className="w-4 h-4" /> Start Practical
                                    Test
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedCourse ? (
                    <CourseEditor
                      course={selectedCourse}
                      onBack={() => {
                        setSelectedCourse(null);
                        fetchCourses();
                      }}
                      onStartSession={(session) => setActiveSession(session)}
                    />
                  ) : (
                    <CoursesList
                      courses={courses}
                      isLoading={isLoadingCourses}
                      onSelectCourse={setSelectedCourse}
                      onCreateCourse={() => setIsCreateCourseOpen(true)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg space-y-6 max-w-2xl mx-auto"
              >
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={profilePic || `https://i.pravatar.cc/150?u=${user.id}`}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full border-4 border-indigo-300 dark:border-indigo-500 object-cover"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files[0] &&
                      setProfilePic(URL.createObjectURL(e.target.files[0]))
                    }
                    className="block w-full max-w-xs text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gray-200 dark:file:bg-gray-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bio"
                    className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows="3"
                    className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  ></textarea>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500"
                  >
                    {uploading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Profile;

// --- Sub-Components for the Teacher Dashboard ---

function CoursesList({ courses, isLoading, onSelectCourse, onCreateCourse }) {
  if (isLoading) return <p className="text-center p-8">Loading courses...</p>;
  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button
          onClick={onCreateCourse}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500"
        >
          + Create New Course
        </Button>
      </div>
      <div className="space-y-4">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {course.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Skill: {course.skill?.name || "N/A"}
                </p>
              </div>
              <div className="flex-shrink-0">
                {course.is_verified ? (
                  <span className="text-sm font-bold bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300 py-1 px-4 rounded-full">
                    ✅ Verified
                  </span>
                ) : (
                  <span className="text-sm font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300 py-1 px-4 rounded-full">
                    ⏳ In Progress
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 py-10 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">
              You haven't created any courses yet.
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseEditor({ course, onBack, onStartSession }) {
  const [topics, setTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const { token } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const fetchTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    try {
      const response = await axiosInstance.get(`/courses/${course.id}/topics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTopics(response.data || []);
    } catch (error) {
      toast.error("Could not load topics.");
    } finally {
      setIsLoadingTopics(false);
    }
  }, [course.id, token]);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await axiosInstance.get(
        `/courses/${course.id}/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(response.data || []);
    } catch (error) {
      toast.error("Could not load sessions for this course.");
    } finally {
      setIsLoadingSessions(false);
    }
  }, [course.id, token]);

  useEffect(() => {
    fetchTopics();
    fetchSessions();
  }, [fetchTopics, fetchSessions]);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle) return;
    try {
      await axiosInstance.post(
        `/courses/${course.id}/topics`,
        { title: newTopicTitle, topic_order: (topics?.length || 0) + 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Topic added!");
      setNewTopicTitle("");
      fetchTopics();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add topic.");
    }
  };

  const handleVerifyCourse = async () => {
    try {
      const response = await axiosInstance.post(
        `/courses/${course.id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.error || "Final verification failed.");
    }
  };

  const allTopicsVerified =
    !isLoadingTopics &&
    topics?.length > 0 &&
    topics.every((t) => t.is_verified);

  return (
    <div>
      {isScheduleModalOpen && (
        <ScheduleSessionModal
          courseId={course.id}
          onClose={() => setIsScheduleModalOpen(false)}
          onSessionCreated={() => {
            setIsScheduleModalOpen(false);
            fetchSessions();
          }}
        />
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-indigo-600 font-semibold mb-6 hover:underline"
      >
        <ChevronLeft className="w-5 h-5" /> Back to Courses
      </button>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
        {course.title}
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8">
        Add topics and schedule live sessions for your curriculum.
      </p>

      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Curriculum Topics
      </h2>
      <form
        onSubmit={handleAddTopic}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <input
          type="text"
          value={newTopicTitle}
          onChange={(e) => setNewTopicTitle(e.target.value)}
          placeholder="e.g., Asynchronous JavaScript"
          className="flex-grow w-full p-3 border-2 rounded-md bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-indigo-700"
        >
          Add Topic
        </button>
      </form>
      {isLoadingTopics ? (
        <p>Loading topics...</p>
      ) : (
        <div className="space-y-3 mb-8">
          {topics.map((topic) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              onVerificationComplete={fetchTopics}
            />
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 border-t dark:border-slate-700 pt-6">
        Live Sessions
      </h2>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsScheduleModalOpen(true)}
          className="bg-gradient-to-r from-green-500 to-teal-500"
        >
          + Schedule New Session
        </Button>
      </div>
      {isLoadingSessions ? (
        <p>Loading sessions...</p>
      ) : (
        <div className="space-y-3 mb-8">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {session.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(session.scheduled_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => onStartSession(session)}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" /> Start Session
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-4">
              No live sessions scheduled yet.
            </p>
          )}
        </div>
      )}

      <div className="text-center border-t dark:border-slate-700 pt-6">
        <button
          onClick={handleVerifyCourse}
          disabled={!allTopicsVerified}
          className={`w-full sm:w-auto font-bold py-3 px-8 rounded-lg shadow-lg transition ${
            allTopicsVerified
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }`}
        >
          Finalize & Verify Course
        </button>
      </div>
    </div>
  );
}

function TopicItem({ topic, onVerificationComplete }) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  const handleStartQuiz = () => {
    setIsStartingQuiz(true);
    setIsQuizOpen(true);
    setIsStartingQuiz(false);
  };

  const handleQuizFinish = (result) => {
    setIsQuizOpen(false);
    if (result?.message) {
      toast.info(result.message);
    }
    onVerificationComplete();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 gap-3">
        <p className="font-medium text-slate-800 dark:text-slate-200">
          <span className="font-bold text-slate-400">{topic.topic_order}.</span>{" "}
          {topic.title}
        </p>
        {topic.is_verified ? (
          <span className="text-xs font-bold bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300 py-1 px-3 rounded-full flex-shrink-0">
            ✅ Verified
          </span>
        ) : (
          <button
            onClick={handleStartQuiz}
            disabled={isStartingQuiz}
            className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold py-1 px-4 rounded-full text-xs hover:bg-indigo-200 transition flex-shrink-0 disabled:opacity-50"
          >
            {isStartingQuiz ? "Preparing..." : "Verify Topic"}
          </button>
        )}
      </div>
      {isQuizOpen && (
        <QuizGenerator
          context={{ type: "teacher_verification", topicId: topic.id }}
          skill={{ name: topic.title }}
          onClose={() => setIsQuizOpen(false)}
          onVerificationComplete={handleQuizFinish}
        />
      )}
    </>
  );
}
