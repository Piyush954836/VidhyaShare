import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import { BookOpen, PlayCircle, CheckCircle } from "lucide-react";

export default function CourseDetails() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axiosInstance.get(`/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(response.data);
      } catch (error) {
        toast.error("Could not load course details.");
        navigate("/explore");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, token, navigate]);

  const handleEnroll = async () => {
    try {
      const response = await axiosInstance.post(
        `/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(response.data.message);
      // Refresh course data to update the enrollment status
      setCourse((prev) => ({ ...prev, is_enrolled: true }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Enrollment failed.");
    }
  };

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading Course...
      </div>
    );
  if (!course) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
                {course.title}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                A comprehensive course on <strong>{course.skill.name}</strong>.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <img
                  src={
                    course.teacher.avatar_url ||
                    `https://i.pravatar.cc/150?u=${course.teacher_id}`
                  }
                  alt={course.teacher.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    Taught by
                  </p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {course.teacher.full_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Topics */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen /> Curriculum
                </h2>
                <ul className="space-y-3">
                  {course.topics
                    .sort((a, b) => a.topic_order - b.topic_order)
                    .map((topic) => (
                      <li
                        key={topic.id}
                        className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <span className="font-bold text-slate-400">
                            {topic.topic_order}.
                          </span>{" "}
                          {topic.title}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {(topic.live_sessions || []).filter((s) =>
                            ["live", "scheduled"].includes(s.status)
                          ).length > 0 ? (
                            course.is_enrolled ? (
                              topic.live_sessions
                                .filter((s) =>
                                  ["live", "scheduled"].includes(s.status)
                                )
                                .map((session) => (
                                  <Button
                                    key={session.id}
                                    // remove disabled={!course.is_enrolled}

                                    onClick={async () => {
                                      try {
                                        const res = await axiosInstance.get(
                                          `/sessions/${session.id}/join`,
                                          {
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                            },
                                          }
                                        );
                                        console.log(res);

                                        if (
                                          res.data &&
                                          res.data.channelName &&
                                          res.data.token
                                        ) {
                                          navigate(
                                            `/live-session/${session.id}`,
                                            {
                                              state: {
                                                appId: res.data.appId,
                                                token: res.data.token,
                                                channelName:
                                                  res.data.channelName,
                                              },
                                            }
                                          );
                                        } else {
                                          toast.error(
                                            "Could not retrieve session credentials."
                                          );
                                        }
                                      } catch (err) {
                                        toast.error(
                                          "Failed to join live session."
                                        );
                                      }
                                    }}
                                    className="bg-emerald-600 text-white font-semibold py-1 px-3 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 w-full md:w-auto"
                                  >
                                    <PlayCircle /> Join
                                    {session.subtopics?.length
                                      ? ": " + session.subtopics.join(", ")
                                      : ""}
                                    <span className="ml-2 text-xs text-slate-200 hidden md:inline">
                                      {new Date(
                                        session.scheduled_at
                                      ).toLocaleString()}
                                    </span>
                                  </Button>
                                ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Enroll to join session
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">
                              No live session
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Right Side: Actions */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg self-start">
                <h2 className="text-2xl font-semibold mb-4">Actions</h2>
                <div className="space-y-4">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2">
                    <PlayCircle /> Watch Demo
                  </Button>

                  <Button
                    onClick={handleEnroll}
                    disabled={course.is_enrolled}
                    className={`w-full flex items-center justify-center gap-2 ${
                      course.is_enrolled
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {course.is_enrolled ? (
                      <>
                        <CheckCircle /> Enrolled
                      </>
                    ) : (
                      "Enroll Now"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
