import fetch from 'node-fetch';
import { supabase } from '../config/supabase.js';

// --- Reusable AI Quiz Generation Logic ---
async function generateQuizFromAI(skill, level) {
    const normalizedLevel = level?.toLowerCase();
    if (!skill || !normalizedLevel) {
        throw new Error('Skill and level are required for AI generation.');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set.");
        throw new Error('Server configuration error.');
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const prompt = `Generate a 5-question multiple-choice quiz about: "${skill}" at a "${normalizedLevel}" difficulty. IMPORTANT: If any part contains a code snippet, enclose it in triple backticks. The "answer" must exactly match one of the "options". Provide a brief "explanation". Return ONLY a valid JSON array of objects.`;
    
    const schema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                question: { type: "STRING" },
                options: { type: "ARRAY", items: { type: "STRING" } },
                answer: { type: "STRING" },
                explanation: { type: "STRING" },
            },
            required: ["question", "options", "answer", "explanation"],
        },
    };
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema },
    };

    const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`AI API request failed with status ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    const quizJsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!quizJsonString) {
        throw new Error("Failed to parse valid quiz data from AI response.");
    }
    
    const quizArray = JSON.parse(quizJsonString);
    const questionTimer = 45; // Fixed timer for quizzes
    return quizArray.map(q => ({ ...q, timer: questionTimer }));
}


// --- START A TEACHER VERIFICATION QUIZ ---
export const startTeacherVerificationQuiz = async (req, res) => {
    const { topicId } = req.params;

    try {
        const { data: topic, error: topicError } = await supabase
            .from('topics')
            .select('title')
            .eq('id', topicId)
            .single();
        
        if (topicError || !topic) {
            return res.status(404).json({ error: 'Topic not found.' });
        }

        const quizWithTimers = await generateQuizFromAI(topic.title, 'intermediate');
        res.json(quizWithTimers);

    } catch (error) {
        console.error('Error starting teacher verification quiz:', error);
        res.status(500).json({ error: error.message || 'Failed to generate verification quiz.' });
    }
};

// --- START A STUDENT SKILL QUIZ ---
// This is your original quiz generation endpoint
export const startStudentQuiz = async (req, res) => {
    const { skill, level } = req.body;
    // ... (You can add your original cooldown check logic here) ...
    try {
        const quizWithTimers = await generateQuizFromAI(skill, level);
        res.json(quizWithTimers);
    } catch (error) {
        console.error('Error starting student quiz:', error);
        res.status(500).json({ error: error.message || 'Failed to generate quiz.' });
    }
};


// --- SAVE QUIZ RESULT (Handles both Students and Teachers) ---
export const saveQuizResult = async (req, res) => {
    const { score, totalQuestions, userSkillId, topic_id } = req.body;
    const userId = req.user.id;
    
    if (score === undefined || !totalQuestions) {
        return res.status(400).json({ error: 'Score and total questions are required.' });
    }
    
    const PASSING_SCORE_PERCENTAGE = 0.60;
    const hasPassed = (score / totalQuestions) >= PASSING_SCORE_PERCENTAGE;
    const percentage = Math.round((score / totalQuestions) * 100);

    // --- Logic for Teacher Verification ---
    if (topic_id) {
        try {
            await supabase.from('teacher_verifications').insert({
                teacher_id: userId,
                topic_id: topic_id,
                passed: hasPassed,
                score_percentage: percentage
            });
            return res.json({ 
                message: `Topic verification ${hasPassed ? 'passed' : 'failed'}! Score: ${percentage}%`,
                passed: hasPassed
            });
        } catch (error) {
            console.error('[ERROR] Saving teacher verification:', error);
            return res.status(500).json({ error: 'Failed to save your verification attempt.' });
        }
    }

    // --- Logic for Student Skill Verification ---
    if (!userSkillId) {
        return res.status(400).json({ error: 'User Skill ID is required for student verification.' });
    }
    
    try {
        // ... (Your existing, comprehensive logic for saving student results, granting points,
        // and handling cooldowns goes here.)
        // For demonstration, a simple response:
        res.status(200).json({ message: 'Result saved for student.', passed: hasPassed });

    } catch (error) {
        console.error('[ERROR] saveQuizResult for student:', error.message);
        res.status(500).json({ error: 'Failed to process quiz result.' });
    }
};