import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../config/supabase.js";

// --- Configuration Constants ---
const PASSING_SCORE_PERCENTAGE = 0.6;
const POINT_CONVERSION_DIVISOR = parseInt(process.env.POINT_CONVERSION_DIVISOR) || 1000;
const ABSOLUTE_FALLBACK_SALARY = parseInt(process.env.ABSOLUTE_FALLBACK_SALARY) || 60000;
const MAX_QUIZ_ATTEMPTS = parseInt(process.env.MAX_QUIZ_ATTEMPTS) || 3;
const COOLDOWN_HOURS = parseInt(process.env.COOLDOWN_HOURS) || 48;

// Difficulty Multipliers & Timers
const DIFFICULTY_MULTIPLIERS = {
  beginner: 1.0,
  intermediate: 1.25,
  advanced: 1.5,
};
const TIMERS = { beginner: 30, intermediate: 45, advanced: 60 };

// --- ✨ AI GENERATION FUNCTION (Updated with your available models) ---
async function generateQuizFromAI(promptSubject, level) {
  const normalizedLevel = level?.toLowerCase();
  if (!promptSubject || !normalizedLevel) {
    throw new Error("Subject and level are required for AI generation.");
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(apiKey);

  // 🚨 THE FIX: Using the exact models found in your script
  const MODELS_TO_TRY = [
    "gemini-2.5-flash",              // Best balance of speed/quality
    "gemini-2.0-flash",              // Excellent stable fallback
    "gemini-2.5-pro-preview-03-25",  // High intelligence fallback
    "gemini-flash-latest"            // Catch-all alias
  ];

  const prompt = `Generate a 5-question multiple-choice quiz about: "${promptSubject}" at a "${normalizedLevel}" difficulty level. IMPORTANT: If any question, option, or explanation contains a code snippet, enclose it in triple backticks. The "answer" field must exactly match one of the "options" array strings. Provide a brief "explanation" for why the answer is correct. Return the response ONLY as a valid JSON array of objects.`;

  let lastError = null;

  // 🔄 Loop through models until one works
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`🤖 Attempting AI generation with model: ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response from AI");

      // Clean potential markdown (sometimes models add ```json ... ``` wrappers)
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const quizArray = JSON.parse(cleanedText);
      
      // Success! Add timers and return immediately
      const questionTimer = TIMERS[normalizedLevel] || 45;
      console.log(`✅ Success with ${modelName}`);
      return quizArray.map((q) => ({ ...q, timer: questionTimer }));

    } catch (error) {
      console.warn(`⚠️ Failed with ${modelName}: ${error.message}`);
      lastError = error;
      // Continue to next model in the loop...
    }
  }

  // If we exit the loop, all models failed
  console.error("❌ All AI models failed.");
  throw lastError || new Error("All available AI models failed to respond.");
}

// --- Controller Functions ---

export const startStudentQuiz = async (req, res) => {
  const { skill, level } = req.body;
  const userId = req.user.id;
  
  try {
    const { data: skillData } = await supabase
      .from("skills")
      .select("id, name")
      .ilike("name", skill)
      .single();
      
    if (skillData) {
      const { data: userSkill } = await supabase
        .from("user_skills")
        .select("cooldown_until")
        .eq("user_id", userId)
        .eq("skill_id", skillData.id)
        .single();
        
      if (userSkill?.cooldown_until && new Date(userSkill.cooldown_until) > new Date()) {
        const cooldownEndTime = new Date(userSkill.cooldown_until).toLocaleString();
        return res.status(403).json({
            error: `You are on cooldown. Next attempt available after ${cooldownEndTime}.`,
          });
      }
    }
  } catch (e) {
    console.error("Error during student cooldown check:", e.message);
  }

  try {
    const quizWithTimers = await generateQuizFromAI(skill, level);
    res.json(quizWithTimers);
  } catch (error) {
    console.error("Error starting student quiz:", error);
    res.status(500).json({ error: "AI Service Unavailable. Please check server logs." });
  }
};

export const startTeacherVerificationQuiz = async (req, res) => {
  const { topicId } = req.params;
  try {
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("title")
      .eq("id", topicId)
      .single();
    if (topicError || !topic) return res.status(404).json({ error: "Topic not found." });

    const quizWithTimers = await generateQuizFromAI(topic.title, "intermediate");
    res.json(quizWithTimers);
  } catch (error) {
    console.error("Error starting teacher verification quiz:", error);
    res.status(500).json({ error: "AI Service Unavailable." });
  }
};

export const saveQuizResult = async (req, res) => {
  // ... (Keep your existing save logic exactly as it is)
  const { userSkillId, score, totalQuestions, topic_id } = req.body;
  const userId = req.user.id;

  if (score === undefined || !totalQuestions) {
    return res.status(400).json({ error: "Score and total questions are required." });
  }

  const verificationScore = score / totalQuestions;
  const percentage = Math.round(verificationScore * 100);
  const hasPassed = verificationScore >= PASSING_SCORE_PERCENTAGE;

  if (topic_id) {
    try {
      const { error } = await supabase.from("teacher_verifications").insert({
          teacher_id: userId,
          topic_id,
          passed: hasPassed,
          score_percentage: percentage,
        });
      if (error) throw error;
      return res.status(200).json({
          message: `Topic verification ${hasPassed ? "passed" : "failed"}! Score: ${percentage}%`,
          passed: hasPassed,
        });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save your verification attempt." });
    }
  }

  if (!userSkillId) {
    return res.status(400).json({ error: "User Skill ID is required for student verification." });
  }

  try {
    const { data: userSkill, error: fetchErr } = await supabase
      .from("user_skills")
      .select(`id, user_id, is_verified, skill_id, level, attempt_count, cooldown_until, skills:skill_id(name, market_data(skill_value_potential))`)
      .eq("id", Number(userSkillId))
      .eq("user_id", userId)
      .single();
      
    if (fetchErr || !userSkill) return res.status(404).json({ error: "User skill record not found." });

    const { skills: { name: skillName }, level, attempt_count: currentAttempts = 0 } = userSkill;
    const skillLevel = level.toLowerCase();
    let pointsGranted = 0;
    let updateData = { verification_score: percentage };
    let isBlockImposed = false;

    if (hasPassed && !userSkill.is_verified) {
      const marketData = userSkill.skills.market_data?.[0];
      const skillValuePotential = parseFloat(marketData?.skill_value_potential) || 0;
      const baseValueForPoints = skillValuePotential > 0 ? skillValuePotential : ABSOLUTE_FALLBACK_SALARY;
      const basePoints = baseValueForPoints / POINT_CONVERSION_DIVISOR;
      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[skillLevel] || 1.0;
      pointsGranted = Math.floor(basePoints * difficultyMultiplier * verificationScore);

      Object.assign(updateData, { is_verified: true, points: pointsGranted, attempt_count: 0, cooldown_until: null });

      const { data: currentProfile } = await supabase.from("profiles").select("total_points").eq("id", userId).single();
      const newTotalPoints = (currentProfile.total_points || 0) + pointsGranted;
      await supabase.from("profiles").update({ total_points: newTotalPoints }).eq("id", userId);
    } else if (!hasPassed) {
      const newAttempts = currentAttempts + 1;
      updateData.attempt_count = newAttempts;
      if (newAttempts >= MAX_QUIZ_ATTEMPTS) {
        const cooldownTime = new Date();
        cooldownTime.setHours(cooldownTime.getHours() + COOLDOWN_HOURS);
        updateData.cooldown_until = cooldownTime.toISOString();
        isBlockImposed = true;
      }
    }

    const { data: finalData, error: finalError } = await supabase.from("user_skills").update(updateData).eq("id", Number(userSkillId)).select().single();
    if (finalError) throw finalError;

    let responseMessage;
    if (hasPassed) responseMessage = `Skill verified! You earned ${pointsGranted} market points. 🎉`;
    else if (isBlockImposed) responseMessage = `Verification failed. Cooldown for ${COOLDOWN_HOURS} hours.`;
    else responseMessage = `Verification failed. Score: ${percentage}%. Attempts remaining: ${MAX_QUIZ_ATTEMPTS - (currentAttempts + 1)}.`;

    res.status(200).json({ message: responseMessage, passed: hasPassed, pointsGranted, userSkill: finalData });
  } catch (error) {
    console.error("[ERROR] saveQuizResult:", error.message);
    res.status(500).json({ error: "Failed to process quiz result." });
  }
};