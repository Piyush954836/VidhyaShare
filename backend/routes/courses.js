import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { createCourse, addTopicToCourse, verifyCourse, getMyCourses, getTopicsForCourse, getSessionsForCourse, getCourseDetails, enrollInCourse } from '../controllers/courses.js';

const router = express.Router();

// POST /api/courses/

router.get('/', authenticate, getMyCourses);

router.get('/:courseId/sessions', authenticate, getSessionsForCourse);

router.get('/:courseId/topics', authenticate, getTopicsForCourse);

router.get('/:courseId', authenticate, getCourseDetails);

// ✨ NEW: Enroll in a course
router.post('/:courseId/enroll', authenticate, enrollInCourse);
// Creates a new course shell
router.post('/', authenticate, createCourse);

// POST /api/courses/:courseId/topics
// Adds a new topic to a specific course
router.post('/:courseId/topics', authenticate, addTopicToCourse);

// POST /api/courses/:courseId/verify
// Submits a course for final verification
router.post('/:courseId/verify', authenticate, verifyCourse);

export default router;