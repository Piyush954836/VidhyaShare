import express from 'express';
import { authenticate } from '../middleware/authenticate.js'; // Adjust path
import { getMyChatRooms, getMessages, sendMessage, initiateChat } from '../controllers/chat.js';

const router = express.Router();

// POST /api/chat/initiate
router.get('/', authenticate, getMyChatRooms);
// Finds or creates a chat room between two users
router.post('/initiate', authenticate, initiateChat);

router.get('/:roomId/messages', authenticate, getMessages);

// ✨ NEW: Route to send a message to a room
router.post('/:roomId/messages', authenticate, sendMessage);

export default router;