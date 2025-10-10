import fs from "fs";
import path from "path";
import multer from "multer";
import { supabase } from "../config/supabase.js";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// Multer storage for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/avatars");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || Date.now();
    cb(null, `${userId}${ext}`);
  },
});

export const uploadAvatar = multer({ storage }).single("avatar");

// GET profile
export const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Profile not found" });

    // Make avatar URL full
    const avatar_url = data.avatar_url
      ? `${BACKEND_URL}${data.avatar_url}`
      : `https://i.pravatar.cc/150?u=${req.user.id}`;

    res.json({ ...data, avatar_url });
  } catch (err) {
    console.error("GET profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT profile
export const updateProfile = async (req, res) => {
  try {

    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: no user found" });

    const full_name = req.body.full_name?.trim() || null;
    const bio = req.body.bio?.trim() || null;

    let avatar_url = null;
    if (req.file) avatar_url = `/uploads/avatars/${req.file.filename}`;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (bio) updateData.bio = bio;
    if (avatar_url) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ error: "No data provided to update" });

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(400).json({ error: error.message });
    }
    if (!data) return res.status(404).json({ error: "Profile not found" });

    // Make avatar URL full for frontend
    const fullAvatarUrl = data.avatar_url ? `${BACKEND_URL}${data.avatar_url}` : null;

    res.json({ ...data, avatar_url: fullAvatarUrl });
  } catch (err) {
    console.error("UPDATE profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
