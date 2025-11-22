import { supabase } from "../config/supabase.js";
import fetch from "node-fetch";
import { generateWrapperCode } from "../utils/generateWrapperCode.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- HELPER FUNCTIONS ---

const handleLevelUp = async (userId, testId) => {
  const { data: test, error: testError } = await supabase
    .from("practical_tests")
    .select("skill_id, level")
    .eq("id", testId)
    .single();
  if (testError || !test) return;

  const { skill_id, level: testLevel } = test;
  const { data: userSkill, error: userSkillError } = await supabase
    .from("user_skills")
    .select("id, level, points")
    .eq("user_id", userId)
    .eq("skill_id", skill_id)
    .single();
  if (userSkillError || !userSkill) return;

  const nextLevelMap = { Beginner: "Intermediate", Intermediate: "Advanced" };
  const nextLevel = nextLevelMap[userSkill.level];

  if (userSkill.level === testLevel && nextLevel) {
    const bonusPoints = userSkill.level === "Beginner" ? 500 : 1000;
    await supabase
      .from("user_skills")
      .update({
        level: nextLevel,
        points: (userSkill.points || 0) + bonusPoints,
      })
      .eq("id", userSkill.id);
    console.log(
      `[LEVEL UP] User ${userId} upgraded to ${nextLevel} for skill ${skill_id}!`
    );
  }
};

// Helper to extract metadata from ANY language (Python, JS, Java)
const extractUniversalDetails = (details) => {
  const signature = details.function_signature || "";
  let className = "Solution"; // Default for Python/JS script files
  let functionName = "";

  // 1. Try to find a function name (supports 'def', 'function', 'void', etc.)
  // Matches: "def my_func", "function myFunc", "int myFunc("
  const fnMatch = signature.match(/(?:def|function|void|int|String|public)\s+([a-zA-Z0-9_]+)\s*\(/);
  if (fnMatch && fnMatch[1]) {
    functionName = fnMatch[1];
  }

  // 2. Try to find a class name (if it exists)
  const classMatch = signature.match(/(?:class)\s+([a-zA-Z0-9_]+)/);
  if (classMatch && classMatch[1]) {
    className = classMatch[1];
  }

  // 3. If Python/JS, strictly require function_name. Class is optional.
  return {
    ...details,
    class_name: className,
    function_name: functionName
  };
};

export async function gradeWithAI(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };

  const apiResponse = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!apiResponse.ok) {
    throw new Error(`AI Grader API failed with status ${apiResponse.status}`);
  }

  const result = await apiResponse.json();
  const aiJsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
  const aiGrading = JSON.parse(aiJsonString);

  if (
    typeof aiGrading.passed !== "boolean" ||
    typeof aiGrading.feedback !== "string"
  ) {
    throw new Error(
      "AI Grader response did not match the required JSON structure."
    );
  }
  return aiGrading;
}

// --- USER-FACING CONTROLLERS ---

export const startTest = async (req, res) => {
  const { user_skill_id } = req.body;
  const userId = req.user.id;
  try {
    const { data: userSkill, error: userSkillError } = await supabase
      .from("user_skills")
      .select("level, skill_id")
      .eq("id", user_skill_id)
      .eq("user_id", userId)
      .single();
    if (userSkillError) throw userSkillError;

    const { data: attemptedSubmissions, error: submissionsError } =
      await supabase
        .from("test_submissions")
        .select("test_id")
        .eq("user_id", userId);
    if (submissionsError) throw submissionsError;

    const attemptedTestIds = attemptedSubmissions.map((t) => t.test_id);
    const query = supabase
      .from("practical_tests")
      .select("id, title, details, level, type, skill:skills (name)")
      .eq("skill_id", userSkill.skill_id)
      .eq("level", userSkill.level);

    if (attemptedTestIds.length > 0) {
      query.not("id", "in", `(${attemptedTestIds.join(",")})`);
    }

    const { data: test, error: testError } = await query.limit(1).single();

    if (testError || !test) {
      return res.status(404).json({
        error:
          "No suitable new tests found for your skill level. Please check back later.",
      });
    }
    res.json(test);
  } catch (err) {
    console.error("[ERROR] startTest:", err);
    res.status(500).json({ error: "Failed to start a test." });
  }
};

// --- HELPER FUNCTIONS (Your handleLevelUp function goes here, no changes needed) ---

export const submitTest = async (req, res) => {
  const { test_id, solution, language_id } = req.body;
  const userId = req.user.id;

  if (!solution || !solution.trim()) {
    return res.status(400).json({ error: "Submission cannot be empty." });
  }

  try {
    const { data: test, error: testError } = await supabase
      .from("practical_tests")
      .select("type, details, evaluation_criteria")
      .eq("id", test_id)
      .single();

    if (testError || !test) throw new Error("Test not found.");

    let finalStatus = "failed";
    let detailedResults = {};
    let score = 0;

    switch (test.type) {
      // In your submitTest function...

      // --- ✂️ REPLACE THE ENTIRE `case "Algorithm": { ... }` BLOCK WITH THIS ---
      case "Algorithm": {
        if (!language_id)
          return res
            .status(400)
            .json({ error: "Language ID is missing for an Algorithm test." });

        const testCases = test.evaluation_criteria?.test_cases || [];
        if (testCases.length === 0)
          throw new Error("No test cases found for this test.");

        const wrapperCode = generateWrapperCode(
          language_id,
          solution,
          test.details
        );

        const submissionBatch = testCases.map((tc) => ({
          language_id,
          source_code: Buffer.from(wrapperCode).toString("base64"),
          // ✅ This sends the clean JSON string from your database directly
          stdin: Buffer.from(tc.input || "[]").toString("base64"),
          expected_output: Buffer.from(tc.output || "").toString("base64"),
        }));

        const judge0Headers = {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
        };

        // --- ⬇️ FIX #1: ADD ERROR HANDLING TO THE INITIAL SUBMISSION ⬇️ ---
        const tokensResponse = await fetch(
          `https://${process.env.JUDGE0_API_HOST}/submissions/batch?base64_encoded=true`,
          {
            method: "POST",
            headers: judge0Headers,
            body: JSON.stringify({ submissions: submissionBatch }),
          }
        );

        if (!tokensResponse.ok) {
          const errorText = await tokensResponse.text();
          throw new Error(
            `Judge0 Submission API Error: Status ${tokensResponse.status} - ${errorText}`
          );
        }
        // --- ⬆️ END OF FIX #1 ⬆️ ---

        const tokens = await tokensResponse.json();
        if (!Array.isArray(tokens))
          throw new Error("Judge0 submissions response invalid.");

        const tokenParams = tokens.map((t) => t.token).join(",");
        let finalResults;
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 2000));

          // --- ⬇️ FIX #2: USE `base64_encoded=true` IN THE POLLING URL ⬇️ ---
          const resultResponse = await fetch(
            `https://${process.env.JUDGE0_API_HOST}/submissions/batch?tokens=${tokenParams}&base64_encoded=true&fields=*`,
            { method: "GET", headers: judge0Headers }
          );

          if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            throw new Error(
              `Judge0 Polling API Error: Status ${resultResponse.status} - ${errorText}`
            );
          }

          const resultData = await resultResponse.json();

          if (!resultData.submissions)
            throw new Error(
              "Invalid polling response from Judge0: 'submissions' key is missing."
            );

          const isProcessing = resultData.submissions.some(
            (s) => s.status.id <= 2
          );

          if (!isProcessing) {
            finalResults = resultData.submissions;
            break;
          }
        }

        if (!finalResults) throw new Error("Grading timed out.");

        const passedCount = finalResults.filter(
          (r) => r.status.id === 3
        ).length;
        const allPassed = passedCount === testCases.length;
        score = Math.round((passedCount / testCases.length) * 100);
        finalStatus = allPassed ? "passed" : "failed";

        // When decoding results, handle null or undefined fields gracefully.
        const decodeBase64 = (str) =>
          str ? Buffer.from(str, "base64").toString("utf-8") : null;

        detailedResults = {
          summary: `${passedCount}/${testCases.length} test cases passed.`,
          test_cases: finalResults.map((result, index) => ({
            status: result.status.description,
            input: testCases[index].input,
            expected_output:
              decodeBase64(result.expected_output)?.trim() || null,
            actual_output: decodeBase64(result.stdout)?.trim() || null,
            error:
              decodeBase64(result.stderr) ||
              decodeBase64(result.compile_output) ||
              null,
          })),
        };
        break;
      }

      case "SQL":
      case "Project":
      case "DevOps": {
        const prompt = `You are an expert code reviewer. TASK: ${JSON.stringify(
          test.details
        )} CRITERIA: ${JSON.stringify(
          test.evaluation_criteria
        )} USER'S SOLUTION: ${solution} Respond with {"passed": boolean, "feedback": "one-sentence explanation"}.`;
        const result = await gradeWithAI(prompt);
        finalStatus = result.passed ? "passed" : "failed";
        score = result.passed ? 100 : 0;
        detailedResults = { summary: result.feedback, test_cases: [] };
        break;
      }

      case "Design":
      case "Scenario": {
        const prompt = `You are a strict grader. SCENARIO: ${JSON.stringify(
          test.details
        )} RUBRIC: ${JSON.stringify(
          test.evaluation_criteria
        )} USER'S RESPONSE: ${solution} Respond with {"passed": boolean, "feedback": "one-sentence explanation"}.`;
        const result = await gradeWithAI(prompt);
        finalStatus = result.passed ? "passed" : "failed";
        score = result.passed ? 100 : 0;
        detailedResults = { summary: result.feedback, test_cases: [] };
        break;
      }

      default:
        throw new Error(`Unsupported test type: ${test.type}`);
    }

    await supabase.from("test_submissions").insert({
      test_id,
      user_id: userId,
      solution,
      status: finalStatus,
      score,
      feedback: JSON.stringify(detailedResults),
    });

    if (finalStatus === "passed") await handleLevelUp(userId, test_id);

    res.json({
      message: "Submission processed!",
      passed: finalStatus === "passed",
      score,
      results: detailedResults,
    });
  } catch (err) {
    console.error("[ERROR] submitTest:", err.message);
    res
      .status(500)
      .json({ error: err.message || "Failed to process submission." });
  }
};

// --- ADMIN-FACING CONTROLLERS ---
// (Your complete, correct admin functions: getAllTests, addTest, updateTest, deleteTest, generateTestWithAI go here)
// ...

/**
 * @route   POST /api/tests/generate-ai
 * @desc    Generate test content using AI (for admin)
 * @access  Admin
 */

// @desc    Get all practical tests (for admin)
export const getAllTests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("practical_tests")
      .select(`id, title, level, type, skill:skills (id, name)`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// @desc    Add a new practical test (for admin)
// Helper function to extract class and function names from a Java signature
const extractJavaDetails = (details) => {
  const signature = details.function_signature || "";
  let className = details.class_name;
  let functionName = details.function_name;

  // If class name is missing, parse it from the signature
  if (!className) {
    const classMatch = signature.match(/class\s+(\w+)/);
    if (classMatch) {
      className = classMatch[1];
    }
  }

  // If function name is missing, parse it from the signature
  if (!functionName) {
    const functionMatch = signature.match(
      /(?:public|protected|private|static|\s)*[\w<>\[\]]+\s+(\w+)\s*\(/
    );
    if (functionMatch) {
      functionName = functionMatch[1];
    }
  }

  return { ...details, class_name: className, function_name: functionName };
};

// Helper function to convert various input formats to standard JSON
const standardizeInputFormat = (inputStr) => {
  if (inputStr === null || typeof inputStr !== "string") return null;
  const trimmedInput = inputStr.trim();

  // Case 1: Handle "null" input for tests like the array sum
  if (trimmedInput.toLowerCase() === "null") {
    return JSON.stringify([null]);
  }

  // Case 2: Handle "new int[] {...}" format
  if (trimmedInput.startsWith("new int[]")) {
    const content = trimmedInput
      .replace(/new int\[\]\s*\{/, "[")
      .replace(/\}/, "]");
    const parsedArray = JSON.parse(content);
    return JSON.stringify([parsedArray]); // Wrap in an outer array for single-argument methods
  }

  // Case 3: Handle already-JSON or double-stringified JSON
  try {
    let parsed = JSON.parse(trimmedInput);
    // If it parses to a string, it might be double-stringified, so parse again
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return JSON.stringify(parsed);
  } catch (e) {
    // If all else fails, return the original string wrapped as a JSON array
    return JSON.stringify([trimmedInput]);
  }
};

export const addTest = async (req, res) => {
  const { skill_id, level, type, title, details, evaluation_criteria } =
    req.body;

  if (!skill_id || !level || !type || !title || !details) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // ✅ STEP 1: AUTOMATICALLY EXTRACT METADATA
    const standardizedDetails = extractUniversalDetails(details);
    if (!standardizedDetails.class_name || !standardizedDetails.function_name) {
      return res
        .status(400)
        .json({
          error:
            "Could not automatically determine class_name or function_name from the function_signature.",
        });
    }

    // ✅ STEP 2: AUTOMATICALLY STANDARDIZE ALL TEST CASE INPUTS
    const standardizedCriteria = { ...evaluation_criteria };
    if (
      standardizedCriteria.test_cases &&
      Array.isArray(standardizedCriteria.test_cases)
    ) {
      standardizedCriteria.test_cases = standardizedCriteria.test_cases.map(
        (tc) => ({
          ...tc,
          input: standardizeInputFormat(tc.input),
        })
      );
    }

    // Now, proceed with the original logic but use the standardized data
    const { data: existingTest, error: checkError } = await supabase
      .from("practical_tests")
      .select("id")
      .eq("skill_id", skill_id)
      .eq("level", level)
      .ilike("title", title)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingTest) {
      return res.status(409).json({
        error:
          "A test with this title already exists for this skill and level.",
      });
    }

    const { data, error } = await supabase
      .from("practical_tests")
      .insert([
        {
          skill_id,
          level,
          type,
          title,
          details: standardizedDetails, // Use standardized details
          evaluation_criteria: standardizedCriteria, // Use standardized criteria
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res
      .status(201)
      .json({ message: "Practical test created successfully", data });
  } catch (err) {
    console.error("[ERROR] addTest:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "This test already exists." });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};
// @desc    Update a practical test (for admin)
export const updateTest = async (req, res) => {
  const { id } = req.params;
  const { skill_id, level, type, title, details, evaluation_criteria } =
    req.body;
  try {
    const { data, error } = await supabase
      .from("practical_tests")
      .update({ skill_id, level, type, title, details, evaluation_criteria })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Test not found." });
    res.json({ message: "Test updated", data });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// @desc    Delete a practical test (for admin)
export const deleteTest = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("practical_tests")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Test not found." });
    res.json({ message: `Test "${data.title}" deleted.` });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const generateTestWithAI = async (req, res) => {
  const { skillName, level, type, topic } = req.body;

  if (!skillName || !level || !type) {
    return res
      .status(400)
      .json({ error: "Skill, level, and type are required." });
  }

  // 1. Construct a dynamic, detailed prompt for the AI
  let prompt;
  const optionalTopic = topic
    ? `The specific topic should be '${topic}'.`
    : "The topic should be a fundamental concept for this skill.";

  switch (type) {
    case "Algorithm":
      prompt = `Generate a practical coding test for a '${level}' level '${skillName}' developer. ${optionalTopic}
            Provide the output as a single valid JSON object with two main keys: "details" and "evaluation_criteria".
            - The "details" object must contain: "problem_statement" (a clear description) and "function_signature" (a code snippet for the user to start with).
            - The "evaluation_criteria" object must contain a "test_cases" array. This array should have at least 5 test cases, including edge cases (e.g., empty or null inputs). Each test case must be an object with "input" and "output" keys, where both are strings.`;
      break;

    case "SQL":
      prompt = `Generate a practical SQL test for a '${level}' level data analyst. The skill is '${skillName}'. ${optionalTopic}
            Provide the output as a single valid JSON object with two main keys: "details" and "evaluation_criteria".
            - The "details" object must contain: "schema_markdown" (the CREATE TABLE statements for 2-3 simple, related tables in a markdown code block) and "problem_statement" (a clear question that requires a query on those tables).
            - The "evaluation_criteria" object must contain one key: "correct_query" (the exact SQL query that solves the problem).`;
      break;

    case "Project":
      prompt = `Generate a practical mini-project test for a '${level}' level '${skillName}' developer. ${optionalTopic}
            Provide the output as a single valid JSON object with two main keys: "details" and "evaluation_criteria".
            - The "details" object must contain: "boilerplate_repo" (a placeholder GitHub URL for a starter project) and "readme_content" (a markdown string with a clear list of requirements for the user to implement).
            - The "evaluation_criteria" object must contain one key: "verification_tests" (a string containing example unit test code, using a common framework like Jest or Pytest, that could be used to grade the project).`;
      break;

    case "Design":
      prompt = `Generate a practical UI/UX design test for a '${level}' level designer specializing in '${skillName}'. ${optionalTopic}
            Provide the output as a single valid JSON object with two main keys: "details" and "evaluation_criteria".
            - The "details" object must contain: "task_description" (a clear and concise design challenge) and "reference_image_url" (a placeholder URL to an image for inspiration or replication).
            - The "evaluation_criteria" object must contain one key: "review_checklist" (an array of at least 3 strings that a reviewer should look for, such as 'Proper use of whitespace', 'Consistent color palette', 'Clear visual hierarchy').`;
      break;

    case "DevOps":
      prompt = `Generate a practical DevOps test for a '${level}' level engineer. The skill is '${skillName}'. ${optionalTopic}
            Provide the output as a single valid JSON object with two main keys: "details" and "evaluation_criteria".
            - The "details" object must contain: "scenario" (a description of a situation, e.g., 'You have a simple Node.js application...') and "task" (a specific goal, e.g., 'Write a complete Dockerfile to containerize it.').
            - The "evaluation_criteria" object must contain one key: "expected_configuration" (a string containing the full, correct configuration file or script that solves the task).`;
      break;

    case "Scenario":
      prompt = `Generate a scenario-based test for a '${level}' level professional in '${skillName}'. ${optionalTopic}
            Provide the output as a single valid JSON object with two main keys: "details" and "evaluation_criteria".
            - The "details" object must contain: "scenario" (a detailed description of a workplace situation) and "task" (a clear instruction on what the user needs to produce, such as 'Draft an email response' or 'Outline a 3-step action plan').
            - The "evaluation_criteria" object must contain one key: "grading_rubric" (an array of strings detailing what to look for in a good answer, e.g., 'Acknowledges the stakeholder's concern', 'Proposes a clear and realistic next step', 'Maintains a professional tone').`;
      break;

    default:
      return res.status(400).json({
        error: `Test generation for type '${type}' is not supported yet.`,
      });
  }

  // 2. Call the Gemini API
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    };

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      throw new Error(
        `Gemini API failed with status ${apiResponse.status}: ${errorBody}`
      );
    }

    const result = await apiResponse.json();
    const aiJsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiJsonString) {
      throw new Error("AI returned an empty response.");
    }

    // 3. Parse and return the structured JSON
    const aiContent = JSON.parse(aiJsonString);

    if (!aiContent.details || !aiContent.evaluation_criteria) {
      throw new Error("AI response did not match the required JSON structure.");
    }

    res.json(aiContent); // Sends back { details: {...}, evaluation_criteria: {...} }
  } catch (err) {
    console.error("[ERROR] generateTestWithAI:", err);
    res.status(500).json({ error: "Failed to generate test content from AI." });
  }
};
