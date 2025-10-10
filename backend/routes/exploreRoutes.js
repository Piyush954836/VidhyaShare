import express from 'express';
import { getPublishedCourses } from '../controllers/exploreController.js';
// ✨ UPDATED: Import the new optional middleware instead of the strict one
import { authenticateOptional } from '../middleware/authenticateOptional.js'; 

const router = express.Router();

// ✨ UPDATED: Use 'authenticateOptional' here
// This allows guests to see the page, while still identifying logged-in users
// so the backend can filter out their own courses.
router.get('/courses', authenticateOptional, getPublishedCourses);

export default router;