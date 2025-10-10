import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  Zap,
  HelpCircle,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  Star,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// Main Component
export default function QuizGenerator({
  skill,
  context,
  onClose,
  onVerificationComplete,
}) {
  const { token } = useAuth();
  const [gameState, setGameState] = useState("loading");
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);

  // ✨ This useEffect is now fully dynamic ✨
  useEffect(() => {
    const generateQuiz = async () => {
      try {
        let url;
        let payload;

        // Determine which API endpoint and payload to use based on context
        if (context?.type === "teacher_verification" && context.topicId) {
          url = `/quiz/topic/${context.topicId}/start-verification`;
          payload = {}; // No body needed, ID is in URL
        } else {
          url = "/quiz/generate-student-quiz"; // Use the dedicated route for students
          payload = { skill: skill.name, level: skill.level };
        }

        const response = await axiosInstance.post(url, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.length > 0) {
          setQuizData(response.data);
          setGameState("quiz");
        } else {
          throw new Error("AI returned an empty or invalid quiz.");
        }
      } catch (err) {
        console.error("Failed to generate quiz:", err);
        const errorMessage =
          err.response?.data?.error ||
          `Could not generate a quiz. Please try again.`;
        setError(errorMessage);
        setGameState("error");
      }
    };

    generateQuiz();
  }, [skill, context, token]);

  // ✨ This submit handler is now fully dynamic ✨
  const handleQuizSubmit = async (finalScore, totalQuestions, userAnswers) => {
    try {
      let payload = { score: finalScore, totalQuestions };

      if (context?.type === "teacher_verification" && context.topicId) {
        payload.topic_id = context.topicId;
      } else {
        payload.userSkillId = skill.id;
      }

      const response = await axiosInstance.post("/quiz/save-result", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const finalQuizData = quizData.map((q, i) => ({
        ...q,
        userAnswer: userAnswers[i],
      }));
      setQuizData(finalQuizData);
      setPointsEarned(response.data.pointsGranted || 0);

      if (response.data.passed) {
        toast.success(response.data.message);
      } else {
        toast.info(response.data.message);
      }
      setGameState("results");
    } catch (err) {
      console.error("Failed to save quiz result:", err);
      toast.error(err.response?.data?.error || "Could not save your score.");
      // Still show results even if saving fails
      const finalQuizData = quizData.map((q, i) => ({
        ...q,
        userAnswer: userAnswers[i],
      }));
      setQuizData(finalQuizData);
      setGameState("results");
    }
  };

  const handleFinish = () => {
    onVerificationComplete();
  };

  const displayName = context?.topicId
    ? skill.name
    : `${skill.name} (${skill.level})`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-100 transform transition-all duration-300 scale-95 animate-scale-in">
        <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            Verification: <span className="text-indigo-400">{displayName}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        {gameState === "loading" && <LoadingState />}
        {gameState === "error" && (
          <ErrorState message={error} onClose={onClose} />
        )}
        {gameState === "quiz" && (
          <QuizView quizData={quizData} onQuizSubmit={handleQuizSubmit} />
        )}
        {gameState === "results" && (
          <ResultsView
            quizData={quizData}
            onFinish={handleFinish}
            pointsEarned={pointsEarned}
          />
        )}
      </div>
    </div>
  );
}

// --- Sub-Components (These are complete and don't need further changes) ---

const LoadingState = () => (
  <div className="text-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
    <p className="mt-4 text-lg font-semibold">Generating Your Quiz...</p>
    <p className="text-gray-600 dark:text-gray-400">
      The AI is crafting unique questions just for you.
    </p>
  </div>
);

const ErrorState = ({ message, onClose }) => (
  <div className="text-center p-8">
    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
      Quiz Generation Failed
    </h3>
    <p className="text-gray-700 dark:text-gray-300 mt-2">{message}</p>
    <button
      onClick={onClose}
      className="mt-6 bg-gray-300 dark:bg-gray-600 text-black dark:text-white font-semibold py-2 px-6 rounded-lg"
    >
      Close
    </button>
  </div>
);

const QuizView = ({ quizData, onQuizSubmit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quizData[0]?.timer || 30);
  const currentQuestion = quizData[currentQuestionIndex];

  const handleSubmit = useCallback(() => {
    let score = 0;
    quizData.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) score++;
    });
    onQuizSubmit(score, quizData.length, selectedAnswers);
  }, [quizData, selectedAnswers, onQuizSubmit]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentQuestionIndex, quizData.length, handleSubmit]);

  useEffect(() => {
    setTimeLeft(quizData[currentQuestionIndex].timer);
  }, [currentQuestionIndex, quizData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestionIndex, handleNext]);

  const handleSelectAnswer = (option) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: option }));
  };

  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          Question {currentQuestionIndex + 1} of {quizData.length}
        </div>
        <div className="flex items-center gap-2 font-semibold bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 px-3 py-1 rounded-full">
          <Clock className="w-5 h-5" />
          Time Left: {timeLeft}s
        </div>
      </div>
      <div className="prose dark:prose-invert max-w-none mb-6 text-xl font-semibold">
        <ReactMarkdown>{currentQuestion.question}</ReactMarkdown>
      </div>
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedAnswers[currentQuestionIndex] === option
                ? "bg-indigo-500 border-indigo-500 text-white font-bold"
                : "bg-gray-100 dark:bg-gray-700 border-transparent hover:border-indigo-400"
            }`}
          >
            <ReactMarkdown components={{ p: React.Fragment }}>
              {option}
            </ReactMarkdown>
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
        >
          {currentQuestionIndex < quizData.length - 1 ? "Next" : "Finish Quiz"}
        </button>
      </div>
    </div>
  );
};

const ResultsView = ({ quizData, onFinish, pointsEarned }) => {
  let score = 0;
  quizData.forEach((q) => {
    if (q.userAnswer === q.answer) score++;
  });
  const percentage = Math.round((score / quizData.length) * 100);
  const passed = percentage >= 60;

  return (
    <div className="text-center p-6">
      <Award
        className={`w-20 h-20 mx-auto mb-4 ${
          passed ? "text-green-500" : "text-red-500"
        }`}
      />
      <h3 className="text-3xl font-bold mb-2">
        {passed ? "Verification Passed!" : "Verification Failed"}
      </h3>
      <p className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-6">
        You scored {score} out of {quizData.length} ({percentage}%)
      </p>
      {passed && pointsEarned > 0 && (
        <div className="bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-3 rounded-lg font-bold text-lg mb-4 flex items-center justify-center gap-2">
          <Star className="w-6 h-6 fill-current" />
          Market Points Granted: {pointsEarned}
        </div>
      )}
      <div className="text-left space-y-4 max-h-60 overflow-y-auto pr-2 text-sm">
        {quizData.map((q, index) => (
          <div
            key={index}
            className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <div className="prose dark:prose-invert max-w-none font-semibold">
              <ReactMarkdown>{`${index + 1}. ${q.question}`}</ReactMarkdown>
            </div>
            <div className="flex items-start mt-2">
              {q.userAnswer === q.answer ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p>
                  Your answer:{" "}
                  <span className="font-medium">
                    {q.userAnswer || "Not answered"}
                  </span>
                  .
                </p>
                <p>
                  Correct:{" "}
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {q.answer}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <ReactMarkdown>{`Explanation: ${q.explanation}`}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onFinish}
        className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
      >
        Return to Profile
      </button>
    </div>
  );
};
