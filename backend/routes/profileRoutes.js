import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getProfile, updateProfile, uploadAvatar } from "../controllers/profileController.js";

const router = express.Router();
router.get("/", authenticate, getProfile);
router.put("/", authenticate, uploadAvatar, updateProfile);

export default router;
