import express from 'express';
import { authenticate } from '../middleware/authenticate.js'; // Adjust path if needed
import { createSession, bookSession, getJoinToken, listSessions, listSessionsByTopic, blockUserFromSession } from '../controllers/sessions.js';

const router = express.Router();

// GET /api/sessions/
// Lists all available, scheduled sessions
router.get('/topic', authenticate, listSessionsByTopic);
router.get('/', authenticate, listSessions);
router.post("/block-user", authenticate, blockUserFromSession);

// POST /api/sessions/
// (Teacher) Schedules a new session
router.post('/', authenticate, createSession);

// POST /api/sessions/:sessionId/book
// (Student) Books a spot in a session
router.post('/:sessionId/book', authenticate, bookSession);

// GET /api/sessions/:sessionId/join
// (Any authorized user) Gets an Agora token to join the call
router.get('/:sessionId/join', authenticate, getJoinToken);

export default router;