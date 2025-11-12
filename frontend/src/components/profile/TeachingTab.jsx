import { ChevronLeft } from "lucide-react";
import Button from "../ui/Button";

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
  onStartSession
}) => {
  if (selectedCourse) {
    // Detail View: Topics and Sessions
    return (
      <>
        <button
          onClick={onClearCourse}
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
                  {/* List sessions for this topic */}
                  {topicSessions[topic.id] &&
                  topicSessions[topic.id].length > 0 ? (
                    <div className="mt-1 flex flex-col gap-2">
                      {topicSessions[topic.id]
                        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                        .map((session) => (
                          <Button
                            key={session.id}
                            onClick={() => onStartSession(session)}
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
                  onClick={() => onScheduleSession(topic)}
                  className="bg-green-500 text-white"
                >
                  + Schedule Session for this Topic
                </Button>
              </div>
            ))}
          </div>
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
  );
};

export default TeachingTab;