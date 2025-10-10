import { supabase } from '../config/supabase.js';

export const authenticateOptional = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // If there's no token, that's okay for this route.
    // We just proceed without attaching a user to the request.
    if (token == null) {
        return next(); 
    }

    try {
        // If there is a token, try to validate it
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            // The token is invalid, but we still don't block the request.
            // We proceed as if the user is a guest.
            console.warn('Optional Auth: An invalid token was provided.');
            return next();
        }
        
        // If the token is valid, attach the user object to the request
        req.user = user;
        next();
    } catch (err) {
        // In case of any other unexpected error, proceed without a user.
        console.error("Optional Auth Middleware Error:", err);
        return next();
    }
};