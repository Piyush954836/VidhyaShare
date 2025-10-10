import { supabase } from "../config/supabase.js";

// --------- Create a new request ---------
export const createRequest = async (req, res) => {
  try {
    const { skill_id } = req.body;
    const userId = req.user?.id;
    console.log("[DEBUG] createRequest input:", { skill_id, userId });

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!skill_id)
      return res.status(400).json({ error: "skill_id is required" });

    // ✅ Find the owner of this skill from user_skills
    const { data: userSkill, error: userSkillError } = await supabase
      .from("user_skills")
      .select("user_id")
      .eq("skill_id", skill_id)
      .neq("user_id", userId)
      .maybeSingle();

    if (userSkillError) {
      console.error("[ERROR] Fetch skill owner failed:", userSkillError);
      return res.status(400).json({ error: userSkillError.message });
    }

    if (!userSkill) {
      console.warn("[DEBUG] No owner found for skill:", skill_id);
      return res.status(404).json({ error: "Skill owner not found" });
    }

    const skill_owner_id = userSkill.user_id;
    console.log("[DEBUG] Skill owner found:", { skill_id, skill_owner_id });

    if (userId === skill_owner_id) {
      console.warn("[DEBUG] User tried to request their own skill:", userId);
      return res.status(400).json({ error: "Cannot request your own skill" });
    }

    // ✅ Check if already requested
    const { data: existingRequest, error: checkError } = await supabase
      .from("requests")
      .select("id, status")
      .eq("requester", userId)
      .eq("skill_id", skill_id)
      .eq("skill_owner_id", skill_owner_id)
      .maybeSingle();

    if (checkError) {
      console.error("[ERROR] checkExistingRequest failed:", checkError);
    }

    if (existingRequest) {
      console.log("[DEBUG] Duplicate request attempt:", existingRequest);
      return res
        .status(409)
        .json({ error: "You already requested this skill" });
    }

    // ✅ Insert new request
    const { data, error } = await supabase
      .from("requests")
      .insert([
        { requester: userId, skill_id, skill_owner_id, status: "pending" },
      ])
      .select()
      .single();

    if (error) {
      console.error("[ERROR] Insert request failed:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("[DEBUG] Request created successfully:", data);
    res.status(201).json({ message: "Request created successfully", data });
  } catch (err) {
    console.error("[ERROR] createRequest exception:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// --------- Get requests made by logged-in user ---------
export const getUserRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("[DEBUG] getUserRequests userId:", userId);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("requests")
      .select(
        `
        id,
        skill_id,
        skill_owner_id,
        status,
        created_at,
        skills (id, name, category),
        requester:profiles!fk_requester (id, full_name, avatar_url),
        owner:profiles!requests_skill_owner_id_fkey (id, full_name, avatar_url)
      `
      )
      .eq("requester", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ERROR] Fetch user requests failed:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("[DEBUG] getUserRequests returned:", data?.length, "rows");
    res.json(data);
  } catch (err) {
    console.error("[ERROR] getUserRequests exception:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// --------- Get requests targeting provider's skills ---------
export const getProviderRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("[DEBUG] getProviderRequests userId:", userId);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("requests")
      .select(
        `
        id,
        requester,
        skill_id,
        status,
        created_at,
        skill_owner_id,
        requester:profiles!fk_requester (id, full_name, avatar_url),
        skills (id, name, category)
      `
      )
      .eq("skill_owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ERROR] Fetch provider requests failed:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("[DEBUG] getProviderRequests returned:", data?.length, "rows");
    res.json(data);
  } catch (err) {
    console.error("[ERROR] getProviderRequests exception:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// --------- Update request status ---------
export const updateRequestStatus = async (req, res) => {
  try {
    const { request_id, status } = req.body;
    console.log("[DEBUG] updateRequestStatus input:", { request_id, status });

    if (!["accepted", "rejected", "cancelled"].includes(status))
      return res.status(400).json({ error: "Invalid status" });

    if (!request_id)
      return res.status(400).json({ error: "request_id is required" });

    const { data, error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", request_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[ERROR] Update request status failed:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("[DEBUG] Request status updated:", { request_id, status });
    res.json({ message: "Request status updated", data });
  } catch (err) {
    console.error("[ERROR] updateRequestStatus exception:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
