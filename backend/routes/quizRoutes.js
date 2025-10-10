import express from 'express';
import { authenticate } from '../middleware/authenticate.js'; // Adjust path if needed
import { 
    startStudentQuiz, 
    startTeacherVerificationQuiz, 
    saveQuizResult 
} from '../controllers/quizController.js';

const router = express.Router();

// Route for students to generate a quiz to verify a skill
router.post('/generate-student-quiz', authenticate, startStudentQuiz);

// Route for teachers to generate a quiz to verify a topic
router.post('/topic/:topicId/start-verification', authenticate, startTeacherVerificationQuiz);

// Single route to save the result for either a student or a teacher
router.post('/save-result', authenticate, saveQuizResult);

export default router;