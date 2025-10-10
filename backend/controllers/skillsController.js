import { supabase } from "../config/supabase.js";
import { processNewSkillMarketData } from '../utils/marketProcessor.js';

// --------- Get all skills (Public) ---------
export const getSkills = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ERROR] getSkills query failed:", error);
      return res.status(400).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error("[ERROR] getSkills exception:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// --------- Add a new skill (Admin Only) ---------
export const addSkill = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: "Name and category are required" });
    }

    // Check if skill already exists (case-insensitive)
    const { data: existingSkills, error: selectErr } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", name)
      .limit(1);

    if (selectErr) throw selectErr;

    if (existingSkills && existingSkills.length > 0) {
      return res.status(409).json({ error: "Skill with this name already exists" });
    }

    // Insert new skill
    const { data, error } = await supabase
      .from("skills")
      .insert([{ name, category }])
      .select('id, name')
      .single();

    if (error) throw error;
    
    // Trigger real-time market data collection for the new skill
    processNewSkillMarketData(data.name, data.id)
      .catch(err => console.error(`[ASYNC FAIL] Market data calculation failed for ${data.name}:`, err.message));

    res.status(201).json({ message: "Skill added successfully", data });
  } catch (err) {
    console.error("[ERROR] addSkill exception:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
};

// ✨ NEW: --------- Update an existing skill (Admin Only) ---------
export const updateSkill = async (req, res) => {
    const { id } = req.params;
    const { name, category } = req.body;

    if (!name || !category) {
        return res.status(400).json({ error: "Name and category are required." });
    }

    try {
        const { data, error } = await supabase
            .from('skills')
            .update({ name, category })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Skill not found.' });
        
        res.json({ message: 'Skill updated successfully', data });

    } catch (err) {
        console.error("[ERROR] updateSkill exception:", err);
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
};

// ✨ NEW: --------- Delete a skill (Admin Only) ---------
export const deleteSkill = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('skills')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Skill not found.' });

        // Note: Due to the 'ON DELETE CASCADE' in your 'user_skills' table,
        // deleting a skill here will automatically remove it from all users who have it.
        // This is the correct behavior for an admin action.

        res.json({ message: `Skill "${data.name}" deleted successfully.` });
        
    } catch (err) {
        console.error("[ERROR] deleteSkill exception:", err);
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
};