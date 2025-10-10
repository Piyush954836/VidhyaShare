import express from "express";
import { authenticate } from "../middleware/authenticate.js";
// ✨ NEW: Import the isAdmin middleware
import { isAdmin } from "../middleware/isAdmin.js"; 
// ✨ NEW: Import the update and delete functions
import { getSkills, addSkill, updateSkill, deleteSkill } from "../controllers/skillsController.js";

const router = express.Router();


router.get("/", authenticate, getSkills);

router.post("/", authenticate, isAdmin, addSkill);

router.put("/:id", authenticate, isAdmin, updateSkill);

router.delete("/:id", authenticate, isAdmin, deleteSkill);

export default router;