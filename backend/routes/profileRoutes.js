import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getProfile, updateProfile, uploadAvatar, getProfileById } from "../controllers/profileController.js";

const router = express.Router();
router.get("/", authenticate, getProfile);
router.put("/", authenticate, uploadAvatar, updateProfile);
router.get("/:id", getProfileById);

export default router;
