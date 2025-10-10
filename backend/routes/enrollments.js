import express from 'express';
import { authenticate } from '../middleware/authenticate.js'; // Adjust path if needed
import { getStudentEnrollments, updateEnrollmentStatus, getMyLearning } from '../controllers/enrollments.js';


const router = express.Router();

// GET /api/enrollments/incoming
// Fetches all pending enrollment requests for the logged-in teacher's courses
router.get('/incoming', authenticate, getStudentEnrollments);

// PATCH /api/enrollments/:enrollmentId/status
// Allows a teacher to accept ('enrolled') or reject a request
router.patch('/:enrollmentId/status', authenticate, updateEnrollmentStatus);

router.get('/my-learning', authenticate, getMyLearning);

export default router;