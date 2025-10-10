import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
  getAllTests,
  addTest,
  updateTest,
  deleteTest,
  generateTestWithAI,
  startTest,
  submitTest, // ✨ NEW: Import the AI generator function
} from "../controllers/practicalTestController.js";

const router = express.Router();

// Admin CRUD routes for managing tests
router
  .route("/")
  .get(authenticate, isAdmin, getAllTests)
  .post(authenticate, isAdmin, addTest);

router
  .route("/:id")
  .put(authenticate, isAdmin, updateTest)
  .delete(authenticate, isAdmin, deleteTest);

// ✨ NEW: AI generation route
router.post("/generate-ai", authenticate, isAdmin, generateTestWithAI);

router.post("/start", authenticate, startTest);
router.post("/submit", authenticate, submitTest);

export default router;
