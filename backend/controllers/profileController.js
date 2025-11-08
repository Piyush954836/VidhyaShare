// controllers/profileController.js
import multer from "multer";
import { supabase } from "../config/supabase.js";

// Use memory storage for multer (buffered upload)
const storage = multer.memoryStorage();
export const uploadAvatar = multer({ storage }).single("avatar");

// Default avatar fallback
const DEFAULT_AVATAR = (id) => `https://i.pravatar.cc/150?u=${id}`;

// GET current user profile
export const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Profile not found" });

    // Ensure avatar_url is a full public URL
    let avatar_url = data.avatar_url;
    if (avatar_url && !avatar_url.startsWith("http")) {
      avatar_url = supabase.storage.from("avatars").getPublicUrl(avatar_url).data.publicUrl;
    }
    avatar_url = avatar_url || DEFAULT_AVATAR(req.user.id);

    res.json({ ...data, avatar_url });
  } catch (err) {
    console.error("GET profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET profile by ID (for notifications/posts)
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Profile not found" });

    // Ensure avatar_url is a full public URL
    let avatar_url = data.avatar_url;
    if (avatar_url && !avatar_url.startsWith("http")) {
      avatar_url = supabase.storage.from("avatars").getPublicUrl(avatar_url).data.publicUrl;
    }
    avatar_url = avatar_url || DEFAULT_AVATAR(id);

    res.json({ id: data.id, full_name: data.full_name, avatar_url });
  } catch (err) {
    console.error("GET profile by ID error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized: no user found" });

    const full_name = req.body.full_name?.trim() || null;
    const bio = req.body.bio?.trim() || null;
    let avatar_url = null;

    // Upload avatar to Supabase Storage if file exists
    if (req.file) {
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${userId}.${fileExt}`; // store directly in bucket root
      const filePath = `avatars/${fileName}`; // <-- keep only bucket folder

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, req.file.buffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return res.status(500).json({ error: "Avatar upload failed" });
      }

      // Save **relative path within bucket**, NOT /uploads/...
      avatar_url = filePath;
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (bio) updateData.bio = bio;
    if (avatar_url) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ error: "No data provided to update" });

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Construct the public URL here for consistency
    const finalAvatarUrl = data.avatar_url
      ? `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/avatars/${data.avatar_url}`
      : `https://i.pravatar.cc/150?u=${userId}`;

    res.json({ ...data, avatar_url: finalAvatarUrl });
  } catch (err) {
    console.error("UPDATE profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

