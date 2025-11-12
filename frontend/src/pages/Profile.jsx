import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import { Zap, BookOpen } from "lucide-react";

// Sub-components (Ensure these are imported from your correct folder structure)
import QuizGenerator from "../components/QuizGenerator";
import PracticalTestModal from "../components/PracticalTestModal";
import LiveSession from "./LiveSession";
import ScheduleSessionModal from "../components/profile/ScheduleSessionModal";
import ProfileHeader from "../components/profile/ProfileHeader";
import EditProfileForm from "../components/profile/EditProfileForm";
import SkillsTab from "../components/profile/SkillsTab";
import TeachingTab from "../components/profile/TeachingTab";

const Profile = () => {
  const { user, token, refreshUser } = useAuth();
  
  // Profile Data State
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Feature State
  const [skills, setSkills] = useState([]);
  const [view, setView] = useState("skills"); // "skills" or "teaching"
  
  // Quiz/Test Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedSkillForQuiz, setSelectedSkillForQuiz] = useState(null);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [selectedSkillForTest, setSelectedSkillForTest] = useState(null);

  // Teaching/Course State
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  
  // Session State
  const [activeSession, setActiveSession] = useState(null);
  const [topics, setTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [sessionModal, setSessionModal] = useState(null); // {topicId, topicTitle}
  const [topicSessions, setTopicSessions] = useState({});

  // --- API Calls ---

  const fetchProfileData = useCallback(async () => {
    if (!user || !token) return;

    try {
      const profileRes = await axiosInstance.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profile = profileRes.data || {};
      let profilePicUrl;

      // --- UPDATED LOGIC WITH CACHE BUSTING ---
      if (profile.avatar_url) {
        // 1. Extract filename
        const filename = profile.avatar_url.split("/").pop();
        
        // 2. Construct Base URL (Your specific bucket path)
        const baseUrl = `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/avatars/avatars/${filename}`;
        
        // 3. Add Cache Buster
        // Use 'updated_at' from DB if available, otherwise use current time to force refresh
        const timestamp = profile.updated_at 
            ? new Date(profile.updated_at).getTime() 
            : new Date().getTime();
            
        profilePicUrl = `${baseUrl}?t=${timestamp}`;
      } else {
        profilePicUrl = `https://i.pravatar.cc/150?u=${user.id}`;
      }
      // ----------------------------------------

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

  // Fetch topics when course is selected
  useEffect(() => {
    async function fetchTopics() {
      if (!selectedCourse || !token) return;
      setIsLoadingTopics(true);
      try {
        const res = await axiosInstance.get(
          `/courses/${selectedCourse.id}/topics`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTopics(res.data || []);
      } catch {
        toast.error("Could not load topics");
      }
      setIsLoadingTopics(false);
    }
    if (selectedCourse) fetchTopics();
  }, [selectedCourse, token]);

  // Fetch sessions per topic
  const fetchTopicSessions = useCallback(async () => {
    if (!selectedCourse || !token || !topics.length) return;
    const sessionsMap = {};
    for (const topic of topics) {
      try {
        const res = await axiosInstance.get(
          `/sessions/topic?topic_id=${topic.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
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

  // --- Handlers ---

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
      
      // Re-fetch profile data to see the new image immediately
      fetchProfileData(); 
      
    } catch (err) {
      toast.error(
        "Failed to update profile: " + (err.response?.data?.error || err.message)
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

  const handleSessionCreated = () => {
    setSessionModal(null);
    fetchTopicSessions();
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <>
      {/* --- Modals --- */}
      {activeSession && (
        <LiveSession
          session={activeSession}
          onClose={() => setActiveSession(null)}
        />
      )}
      {/* Ensure you import CreateCourseModal if it exists in your components folder */}
      {isCreateCourseOpen && (
         // Placeholder for CreateCourseModal component
         <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
             <div className="bg-white p-4 rounded">
                 <p>Create Course Modal Placeholder</p>
                 <button onClick={() => setIsCreateCourseOpen(false)}>Close</button>
             </div>
         </div>
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
      {sessionModal && (
        <ScheduleSessionModal
          topicId={sessionModal.topicId}
          topicTitle={sessionModal.topicTitle}
          courseId={selectedCourse.id}
          onClose={() => setSessionModal(null)}
          onSessionCreated={handleSessionCreated}
        />
      )}

      {/* --- Main Layout --- */}
      <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 px-4 md:px-10 py-8 overflow-y-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Profile
            </h1>

            {editing ? (
              <EditProfileForm
                user={user}
                name={name}
                setName={setName}
                bio={bio}
                setBio={setBio}
                profilePic={profilePic}
                setProfilePic={setProfilePic}
                uploading={uploading}
                handleSave={handleSave}
                onCancel={() => setEditing(false)}
                fileInputRef={fileInputRef}
              />
            ) : (
              <div className="space-y-12">
                <ProfileHeader
                  user={user}
                  name={name}
                  bio={bio}
                  profilePic={profilePic}
                  onEdit={() => setEditing(true)}
                />

                {/* Tabs Container */}
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
                    <SkillsTab
                      skills={skills}
                      onStartVerification={handleStartVerification}
                      onStartTest={handleStartTest}
                    />
                  ) : (
                    <TeachingTab
                      courses={courses}
                      selectedCourse={selectedCourse}
                      isLoadingCourses={isLoadingCourses}
                      isLoadingTopics={isLoadingTopics}
                      topics={topics}
                      topicSessions={topicSessions}
                      onSelectCourse={setSelectedCourse}
                      onClearCourse={() => setSelectedCourse(null)}
                      onCreateCourse={() => setIsCreateCourseOpen(true)}
                      onScheduleSession={(topic) =>
                        setSessionModal({ topicId: topic.id, topicTitle: topic.title })
                      }
                      onStartSession={(session) => setActiveSession(session)}
                    />
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Profile;