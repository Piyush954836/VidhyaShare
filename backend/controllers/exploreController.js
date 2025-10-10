import { supabase } from "../config/supabase.js";

// GET /api/explore/courses
// Fetches all verified, published courses for the Explore page.
export const getPublishedCourses = async (req, res) => {
    try {
        // ✨ THE FIX: Check if req.user exists. If it doesn't, use null.
        // This makes the function safe for both guests and logged-in users.
        const requesting_user_id = req.user ? req.user.id : null; 

        // Call the database function, passing the user ID (or null)
        const { data, error } = await supabase.rpc('get_published_courses', { 
            requesting_user_id 
        });

        if (error) {
            console.error("[ERROR] Fetching published courses RPC failed:", error);
            // Throw the specific database error to be caught below
            throw error;
        }

        return res.status(200).json(data);

    } catch (err) {
        console.error("[ERROR] getPublishedCourses exception:", err);
        return res.status(500).json({ error: "Something went wrong while fetching courses." });
    }
};