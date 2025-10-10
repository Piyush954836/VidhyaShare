import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { addUserSkill, getUserSkills, deleteUserSkill } from "../controllers/userSkillsController.js";

const router = express.Router();

// Get all user skills
router.get("/", authenticate, getUserSkills);

// Add a skill to user
router.post("/", authenticate, addUserSkill);

// Delete a skill from user
router.delete("/:id", authenticate, deleteUserSkill);

export default router;
