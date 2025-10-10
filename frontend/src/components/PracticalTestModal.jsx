import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  LoaderCircle,
  CheckCircle,
  XCircle,
  Terminal,
  Maximize,
  Minimize,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const LANGUAGE_MAP = {
  JavaScript: { monaco: "javascript", judge0Id: 93 },
  Python: { monaco: "python", judge0Id: 71 },
  Java: { monaco: "java", judge0Id: 62 },
  "C++": { monaco: "cpp", judge0Id: 54 },
  "C#": { monaco: "csharp", judge0Id: 51 },
  C: { monaco: "c", judge0Id: 50 },
  Go: { monaco: "go", judge0Id: 95 },
};

export default function PracticalTestModal({
  userSkill,
  onClose,
  onTestComplete,
}) {
  const { token } = useAuth();
  const [test, setTest] = useState(null);
  const [solution, setSolution] = useState("");
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const languageInfo =
    LANGUAGE_MAP[userSkill.name] || LANGUAGE_MAP["JavaScript"];

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await axiosInstance.post(
          "/tests/start",
          { user_skill_id: userSkill.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTest(res.data);
        setSolution(res.data.details.function_signature || "");
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to load test.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetchTest();
  }, [userSkill, token, onClose]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await axiosInstance.post(
        "/tests/submit",
        {
          test_id: test.id,
          solution: solution,
          language_id: languageInfo.judge0Id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);

      if (res.data.passed) {
        toast.success(`Test Passed! Score: ${res.data.score}/100`);
        setTimeout(() => {
          onTestComplete();
        }, 3000);
      } else {
        toast.error(
          res.data.results.summary ||
            `Test Failed. Score: ${res.data.score}/100`
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to process your submission.";
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTestInput = () => {
    if (!test) return null;

    switch (test.type) {
      case "Algorithm":
      case "SQL":
      case "DevOps":
        return (
          <Editor
            height="100%"
            language={languageInfo.monaco || "plaintext"}
            value={solution}
            onChange={(value) => setSolution(value)}
            theme="vs-dark"
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
        );

      case "Project":
      case "Design":
        return (
          <div className="p-6">
            <label className="block font-semibold mb-2 dark:text-slate-200">
              Submission Link
            </label>
            <input
              type="url"
              placeholder="https://github.com/your-repo or https://figma.com/..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        );

      case "Scenario":
        return (
          <div className="p-6 h-full">
            <label className="block font-semibold mb-2 dark:text-slate-200">
              Your Response
            </label>
            <textarea
              placeholder="Write your response here..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full h-[calc(100%-30px)] p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        );

      default:
        return <p className="p-6">This test type is not supported yet.</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex flex-col justify-center items-center z-50 text-white">
        <LoaderCircle className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Preparing your test environment...</p>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm ${
        isFullScreen ? "p-0" : "p-4"
      }`}
    >
      <div
        className={`bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden border dark:border-slate-700 transition-all duration-300 ${
          isFullScreen
            ? "w-screen h-screen rounded-none"
            : "w-full max-w-7xl h-[90vh] rounded-2xl"
        }`}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {test?.title} - {test?.skill.name} ({test?.level})
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {isFullScreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-3xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              &times;
            </button>
          </div>
        </header>

        <PanelGroup direction="horizontal" className="flex-1 min-h-0">
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full p-6 overflow-y-auto">
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
                Task Details
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                <ReactMarkdown>
                  {test?.details.problem_statement ||
                    test?.details.task_description ||
                    test?.details.scenario}
                </ReactMarkdown>
                {test?.details.readme_content && (
                  <ReactMarkdown>{test.details.readme_content}</ReactMarkdown>
                )}
                {test?.details.reference_image_url && (
                  <img
                    src={test.details.reference_image_url}
                    alt="Reference Design"
                    className="mt-4 rounded-lg border dark:border-slate-600"
                  />
                )}
                {test?.details.schema_markdown && (
                  <>
                    <h4 className="font-semibold mt-4">Database Schema</h4>
                    <ReactMarkdown>
                      {test.details.schema_markdown}
                    </ReactMarkdown>
                  </>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-slate-200 dark:bg-slate-700 hover:bg-sky-500 dark:hover:bg-sky-500 transition-colors duration-200 cursor-col-resize" />

          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={25}>
                {renderTestInput()}
              </Panel>
              <PanelResizeHandle className="h-2 bg-slate-200 dark:bg-slate-700 hover:bg-sky-500 dark:hover:bg-sky-500 transition-colors duration-200 cursor-row-resize" />
              <Panel defaultSize={30} minSize={15}>
                <div className="h-full bg-gray-100 dark:bg-slate-900 p-4 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="flex justify-between items-center mb-2 shrink-0">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5" />
                      Result Console
                    </h3>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-green-600 text-white px-4 py-1 rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                      ) : null}
                      {isSubmitting ? "Running..." : "Run & Submit"}
                    </button>
                  </div>
                  <div className="flex-1 h-full overflow-y-auto">
                    {result ? (
                      result.error ? (
                        <div className="p-3 rounded-md text-sm bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                          <div className="flex items-center gap-2 font-bold mb-1">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span>Submission Error</span>
                          </div>
                          <p>{result.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div
                            className={`p-2 rounded-md font-bold text-sm ${
                              result.passed
                                ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {result.passed ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <span>{result.results.summary}</span>
                              </div>
                              <span className="font-mono text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">
                                Score: {result.score}
                              </span>
                            </div>
                          </div>
                          {result.results.test_cases?.map((tc, index) => (
                            <div
                              key={index}
                              className="p-2 bg-white dark:bg-slate-800 rounded text-xs border dark:border-slate-700"
                            >
                              <div className="flex items-center gap-2 font-medium">
                                {tc.status === "Passed" ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>
                                  Test Case #{index + 1}: {tc.status}
                                </span>
                              </div>
                              {tc.status !== "Passed" && (
                                <div className="mt-1 pl-6 font-mono text-slate-500 text-[11px]">
                                  <p>
                                    <strong>Input:</strong>{" "}
                                    <code className="bg-slate-200 dark:bg-slate-700 p-1 rounded">
                                      {tc.input}
                                    </code>
                                  </p>
                                  <p>
                                    <strong>Expected:</strong>{" "}
                                    <code className="bg-slate-200 dark:bg-slate-700 p-1 rounded">
                                      {tc.expected_output}
                                    </code>
                                  </p>
                                  <p>
                                    <strong>Got:</strong>{" "}
                                    <code className="bg-red-200 dark:bg-red-700 p-1 rounded">
                                      {tc.actual_output || `(No output)`}
                                    </code>
                                  </p>
                                  {tc.error && (
                                    <p className="mt-1 text-red-500">
                                      <strong>Error:</strong>{" "}
                                      <pre className="whitespace-pre-wrap">
                                        {tc.error}
                                      </pre>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Your code's result will appear here after submission.
                      </p>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
