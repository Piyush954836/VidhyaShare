import { supabase } from "../config/supabase.js";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Ask Supabase to validate the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("[AUTH ERROR] Supabase token validation failed:", error?.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach user object to request
    req.user = user;
    next();

  } catch (err) {
    console.error("[AUTH ERROR] Exception in authenticate middleware:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
