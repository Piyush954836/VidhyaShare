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


const CountdownTimer = ({ expiryTimestamp }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = +new Date(expiryTimestamp) - +new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }, [expiryTimestamp]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  useEffect(() => {
    const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearTimeout(timer);
  }, [calculateTimeLeft, timeLeft]);

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

function ScheduleSessionModal({
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
          <div>
            <label
              htmlFor="subtopics"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Subtopics (comma-separated)
            </label>
            <input
              id="subtopics"
              type="text"
              value={subtopicsInput}
              onChange={(e) => setSubtopicsInput(e.target.value)}
              placeholder="e.g. Introduction, Advanced Examples"
              className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
              required
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
              required
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

const Profile = () => {
  const { user, token, refreshUser } = useAuth();
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

  // For topics and their sessions
  const [topics, setTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [sessionModal, setSessionModal] = useState(null); // {topicId, topicTitle} or null
  const [topicSessions, setTopicSessions] = useState({}); // Maps topicId to array of sessions


const fetchProfileData = useCallback(async () => {
  if (!user || !token) return;

  try {
    const profileRes = await axiosInstance.get("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profile = profileRes.data || {};

    // Handle avatar URL properly
    let profilePicUrl;
    if (profile.avatar_url && profile.avatar_url.trim() !== "") {
      // Extract filename from any path
      const filename = profile.avatar_url.split("/").pop();
      profilePicUrl = `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/avatars/avatars/${filename}`;
    } else {
      profilePicUrl = `https://i.pravatar.cc/150?u=${user.id}`;
    }

    setName(profile.full_name?.trim() || "User");
    setBio(profile.bio?.trim() || "");
    setProfilePic(profilePicUrl);

    const skillsRes = await axiosInstance.get("/user-skills", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);
  } catch (err) {
    console.error("Profile fetch error:", err);
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

  // Fetch topics for selected course
  useEffect(() => {
    async function fetchTopics() {
      if (!selectedCourse || !token) return;
      setIsLoadingTopics(true);
      try {
        const res = await axiosInstance.get(
          `/courses/${selectedCourse.id}/topics`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTopics(res.data || []);
      } catch {
        toast.error("Could not load topics");
      }
      setIsLoadingTopics(false);
    }
    if (selectedCourse) fetchTopics();
  }, [selectedCourse, token]);

  // Fetch sessions PER TOPIC
  const fetchTopicSessions = useCallback(async () => {
    if (!selectedCourse || !token || !topics.length) return;
    const sessionsMap = {};
    for (const topic of topics) {
      try {
        // Assumes backend route returns ALL sessions for this topic (adjust as needed)
        const res = await axiosInstance.get(
          `/sessions/topic?topic_id=${topic.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        sessionsMap[topic.id] = res.data || [];
      } catch {
        sessionsMap[topic.id] = [];
      }
    }
    setTopicSessions(sessionsMap);
  }, [selectedCourse, topics, token]);

  useEffect(() => {
    if (selectedCourse && topics.length) fetchTopicSessions();
  }, [selectedCourse, topics, fetchTopicSessions]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);
  useEffect(() => {
    if (view === "teaching") {
      fetchCourses();
    }
  }, [view, fetchCourses]);

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
  const openScheduleSessionModal = (topic) =>
    setSessionModal({ topicId: topic.id, topicTitle: topic.title });
  const closeScheduleSessionModal = () => setSessionModal(null);
  const handleSessionCreated = () => {
    closeScheduleSessionModal();
    fetchTopicSessions();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

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
                {/* Profile Card */}
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
                {/* Skill/Teaching Tabs */}
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
                  {/* Skills Tab */}
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
                    <>
                      <button
                        onClick={() => setSelectedCourse(null)}
                        className="flex items-center gap-2 text-indigo-600 font-semibold mb-6 hover:underline"
                      >
                        <ChevronLeft className="w-5 h-5" /> Back to Courses
                      </button>
                      <h2 className="text-xl font-semibold mb-2">
                        Topics for {selectedCourse.title}
                      </h2>
                      {isLoadingTopics ? (
                        <p>Loading topics...</p>
                      ) : (
                        <div className="space-y-4">
                          {topics.map((topic) => (
                            <div
                              key={topic.id}
                              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 gap-3"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                  <span className="font-bold text-slate-400">
                                    {topic.topic_order}.
                                  </span>{" "}
                                  {topic.title}
                                </p>
                                {/* List all sessions for this topic */}
                                {topicSessions[topic.id] &&
                                topicSessions[topic.id].length > 0 ? (
                                  <div className="mt-1 flex flex-col gap-2">
                                    {topicSessions[topic.id]
                                      .sort(
                                        (a, b) =>
                                          new Date(a.scheduled_at) -
                                          new Date(b.scheduled_at)
                                      )
                                      .map((session) => (
                                        
                                        <Button
                                          key={session.id}
                                          onClick={() =>{
                                            console.log("Trying to start LiveSession with:", session);
                                            setActiveSession(session)
                                          }}
                                          className="bg-blue-500 text-white w-full"
                                        >
                                          Start Session:{" "}
                                          {session.subtopics
                                            ? session.subtopics.join(", ")
                                            : session.title}
                                        </Button>
                                      ))}
                                  </div>
                                ) : (
                                  <span className="block text-sm text-gray-400 mt-1">
                                    No sessions scheduled yet.
                                  </span>
                                )}
                              </div>
                              <Button
                                onClick={() => openScheduleSessionModal(topic)}
                                className="bg-green-500 text-white"
                              >
                                + Schedule Session for this Topic
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {sessionModal && (
                        <ScheduleSessionModal
                          topicId={sessionModal.topicId}
                          topicTitle={sessionModal.topicTitle}
                          courseId={selectedCourse.id}
                          onClose={closeScheduleSessionModal}
                          onSessionCreated={handleSessionCreated}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-end mb-6">
                        <Button
                          onClick={() => setIsCreateCourseOpen(true)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500"
                        >
                          Create New Course
                        </Button>
                      </div>
                      {isLoadingCourses ? (
                        <p className="text-center p-8">Loading courses...</p>
                      ) : (
                        <div className="space-y-4">
                          {courses.length === 0 ? (
                            <div className="text-center text-slate-500 py-10 border-2 border-dashed rounded-lg">
                              <h3 className="text-lg font-semibold">
                                You haven't created any courses yet.
                              </h3>
                            </div>
                          ) : (
                            courses.map((course) => (
                              <div
                                key={course.id}
                                onClick={() => setSelectedCourse(course)}
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
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="text-sm font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300 py-1 px-4 rounded-full">
                                      In Progress
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
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
