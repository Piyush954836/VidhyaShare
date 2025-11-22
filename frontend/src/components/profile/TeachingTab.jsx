import { useState } from "react";
import { ChevronLeft, Plus, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import Button from "../ui/Button";
import AddTopicModal from "./AddTopicModal";

const TeachingTab = ({
  courses,
  selectedCourse,
  isLoadingCourses,
  isLoadingTopics,
  topics,
  topicSessions,
  onSelectCourse,
  onClearCourse,
  onCreateCourse,
  onScheduleSession,
  onStartSession,
  onRefreshTopics,
  onVerifyTopic, // <--- NEW: To trigger quiz for a topic
  onFinalizeCourse // <--- NEW: To submit course for verification
}) => {
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  // Helper to check if all topics are verified
  const allTopicsVerified = topics?.length > 0 && topics.every(t => t.is_verified);

  if (selectedCourse) {
    // Detail View: Topics and Sessions
    return (
      <>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <button
              onClick={onClearCourse}
              className="flex items-center gap-2 text-indigo-600 font-semibold mb-2 hover:underline"
            >
              <ChevronLeft className="w-5 h-5" /> Back to Courses
            </button>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Topics for {selectedCourse.title}
              {selectedCourse.is_verified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Live Course
                </span>
              )}
            </h2>
          </div>
          
          <Button 
            onClick={() => setIsAddTopicOpen(true)}
            className="bg-indigo-600 text-white flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Add Topic
          </Button>
        </div>

        {isLoadingTopics ? (
          <p className="text-center py-8 text-slate-500">Loading topics...</p>
        ) : (
          <div className="space-y-4">
            {topics.length === 0 ? (
              <div className="text-center p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                <p className="text-slate-500 mb-4">No topics added to this course yet.</p>
                <Button onClick={() => setIsAddTopicOpen(true)} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300">
                  Add your first topic
                </Button>
              </div>
            ) : (
              <>
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border gap-3 transition-all ${
                      topic.is_verified 
                        ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900" 
                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          <span className="font-bold text-slate-400">
                            {topic.topic_order}.
                          </span>{" "}
                          {topic.title}
                        </p>
                        {/* Verification Badge */}
                        {topic.is_verified ? (
                          <span className="text-xs flex items-center text-green-600 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs flex items-center text-amber-600 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertCircle className="w-3 h-3 mr-1" /> Pending Verification
                          </span>
                        )}
                      </div>

                      {/* List sessions */}
                      {topicSessions[topic.id] && topicSessions[topic.id].length > 0 ? (
                        <div className="mt-2 flex flex-col gap-2">
                          {topicSessions[topic.id]
                            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                            .map((session) => (
                              <Button
                                key={session.id}
                                onClick={() => onStartSession(session)}
                                className="bg-blue-500 hover:bg-blue-600 text-white w-full text-left text-sm py-1 px-3"
                              >
                                🎥 Start Session: {session.subtopics ? session.subtopics.join(", ") : session.title}
                              </Button>
                            ))}
                        </div>
                      ) : (
                        <span className="block text-xs text-slate-400 mt-1 italic">
                          No sessions scheduled.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {/* Verify Topic Button */}
                      {!topic.is_verified && (
                        <Button
                          onClick={() => onVerifyTopic(topic)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-sm flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-4 h-4" /> Verify Topic
                        </Button>
                      )}
                      
                      {/* Schedule Session Button (Only if verified) */}
                      {topic.is_verified && (
                        <Button
                          onClick={() => onScheduleSession(topic)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm"
                        >
                          + Schedule Session
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Final Course Verification Button */}
                {!selectedCourse.is_verified && (
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                    <h3 className="text-lg font-semibold mb-2">Ready to Publish?</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Once all topics are verified, you can submit your course for final approval.
                    </p>
                    <Button
                      disabled={!allTopicsVerified}
                      onClick={() => onFinalizeCourse(selectedCourse.id)}
                      className={`w-full sm:w-auto py-3 px-8 text-lg font-bold ${
                        allTopicsVerified
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform hover:scale-105"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {allTopicsVerified ? "🚀 Finalize & Publish Course" : "Verify All Topics to Publish"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {isAddTopicOpen && (
          <AddTopicModal
            courseId={selectedCourse.id}
            onClose={() => setIsAddTopicOpen(false)}
            onTopicAdded={() => {
              setIsAddTopicOpen(false);
              if (onRefreshTopics) onRefreshTopics();
            }}
          />
        )}
      </>
    );
  }

  // List View: Courses
  return (
    <>
      <div className="flex justify-end mb-6">
        <Button
          onClick={onCreateCourse}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg"
        >
          Create New Course
        </Button>
      </div>
      {isLoadingCourses ? (
        <p className="text-center p-8 text-slate-500">Loading courses...</p>
      ) : (
        <div className="space-y-4">
          {courses.length === 0 ? (
            <div className="text-center text-slate-500 py-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              <h3 className="text-lg font-semibold">
                You haven't created any courses yet.
              </h3>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    {course.title}
                    {course.is_verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Verified</span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Skill: {course.skill?.name || "N/A"}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {course.is_verified ? (
                    <span className="text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 py-1 px-4 rounded-full">
                      Published
                    </span>
                  ) : (
                    <span className="text-sm font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 py-1 px-4 rounded-full">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default TeachingTab;