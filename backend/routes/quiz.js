import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createCourse, addTopicToCourse, verifyCourse } from '../controllers/courses.js';

const router = express.Router();

// POST /api/courses/
// Creates a new course shell
router.post('/', authenticateToken, createCourse);

// POST /api/courses/:courseId/topics
// Adds a new topic to a specific course
router.post('/:courseId/topics', authenticateToken, addTopicToCourse);

// POST /api/courses/:courseId/verify
// Submits a course for final verification
router.post('/:courseId/verify', authenticateToken, verifyCourse);

export default router;