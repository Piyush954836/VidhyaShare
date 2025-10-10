import { supabase } from "../config/supabase.js";

export const isAdmin = async (req, res, next) => {
    try {
        // req.user.id is available from your initial auth middleware
        const userId = req.user.id; 

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        if (profile.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required.' });
        }

        // If the user is an admin, proceed to the next function (the controller)
        next();

    } catch (err) {
        res.status(500).json({ error: 'Internal server error during role check.' });
    }
};