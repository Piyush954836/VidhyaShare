import { supabase } from "../config/supabase.js";

// --------- Add skill to user ---------
// This function is well-structured and requires no changes.
export const addUserSkill = async (req, res) => {
  const { skill_id, points, level } = req.body;

  if (!skill_id) return res.status(400).json({ error: "skill_id is required" });

  const finalPoints = points || 0;

  try {
    // 1️⃣ Check if skill exists globally
    const { data: existingSkill, error: skillError } = await supabase
      .from("skills")
      .select("id")
      .eq("id", skill_id)
      .single();

    if (skillError || !existingSkill)
      return res.status(400).json({ error: "Invalid skill_id" });

    // 2️⃣ Check if user already has this skill
    const { data: existingUserSkill } = await supabase
      .from("user_skills")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("skill_id", skill_id)
      .single();

    if (existingUserSkill)
      return res.status(400).json({ error: "You already have this skill" });

    // 3️⃣ Insert into user_skills
    const { data, error } = await supabase
      .from("user_skills")
      .insert([{ user_id: req.user.id, skill_id, points: finalPoints, level}])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Skill added successfully", data });
  } catch (err) {
    console.error("[ERROR] addUserSkill:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// --------- Get user's skills (FIXED) ---------
export const getUserSkills = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_skills")
      // ✨ FIXED: Added attempt_count and cooldown_until to the selection
      .select(`
        user_skill_pk:id, 
        points,
        level,
        is_verified,
        attempt_count,
        cooldown_until, 
        skill_info:skill_id (
          skill_id_fk:id,
          name,
          category
        )
      `)
      .eq("user_id", req.user.id);

    if (error) {
      console.error("[ERROR] getUserSkills query failed:", error);
      return res.status(400).json({ error: error.message });
    }

    // Map data for easier frontend usage
    const mappedData = data.map((item) => ({
      id: String(item.user_skill_pk),
      points: item.points,
      skill_id: item.skill_info.skill_id_fk,
      name: item.skill_info.name,
      level: item.level,
      category: item.skill_info.category,
      is_verified: item.is_verified,
      // ✨ FIXED: Include the new fields in the mapped response
      attempt_count: item.attempt_count,
      cooldown_until: item.cooldown_until,
    }));

    res.json(mappedData);
  } catch (err) {
    console.error("[ERROR] getUserSkills:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// --------- Delete skill from user (IMPROVED) ---------
export const deleteUserSkill = async (req, res) => {
  try {
    const { id } = req.params; // This is the user_skill primary key
    if (!id) return res.status(400).json({ error: "user_skill id is required" });

    // ✨ IMPROVED: First, fetch the skill to get its point value before deleting.
    const { data: skillToDelete, error: fetchError } = await supabase
      .from("user_skills")
      .select("points, user_id")
      .eq("id", id)
      .eq("user_id", req.user.id) // Ensure users can only delete their own skills
      .single();

    if (fetchError || !skillToDelete) {
      return res.status(404).json({ error: "Skill not found or you are not authorized to delete it." });
    }

    // Now, perform the deletion
    const { error: deleteError } = await supabase
      .from("user_skills")
      .delete()
      .eq("id", id);

    if (deleteError) return res.status(400).json({ error: deleteError.message });
    
    // If the deleted skill had points, subtract them from the user's total score
    if (skillToDelete.points > 0) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", skillToDelete.user_id)
        .single();

      if (profileError) throw new Error("Could not fetch user profile to update points.");

      const newTotalPoints = (profile.total_points || 0) - skillToDelete.points;
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ total_points: newTotalPoints < 0 ? 0 : newTotalPoints }) // Prevent negative points
        .eq("id", skillToDelete.user_id);
      
      if (updateError) throw new Error("Could not update user's total points.");
    }

    res.json({ message: "Skill removed successfully" });
  } catch (err) {
    console.error("[ERROR] deleteUserSkill:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};