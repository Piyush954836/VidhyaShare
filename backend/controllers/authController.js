import { supabase } from "../config/supabase.js";

// Load configuration for initial points
const INITIAL_POINTS_BONUS = parseInt(process.env.INITIAL_POINTS_BONUS) || 500;

// --------- Email/Password Signup ---------
export const signup = async (req, res) => {
	try {
		const { email, password, full_name } = req.body;
		if (!email || !password || !full_name)
			return res.status(400).json({ error: "All fields required" });

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { full_name } }
		});

		if (error) return res.status(400).json({ error: error.message });

		const new_user_id = data.user.id;
		console.log("[DEBUG] Signup Supabase user object:", data.user);

		// Ensure profile exists AND grant initial points
		const { data: profile } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", new_user_id)
			.single();

		if (!profile) {
			const { error: insertError } = await supabase.from("profiles").insert([
				{ 
					id: new_user_id, 
					full_name,
					// 💡 FIX: Grant initial points here
					total_points: INITIAL_POINTS_BONUS 
				}
			]);
			
			if (insertError) {
				console.error("[ERROR] Profile insertion failed with initial points:", insertError);
				// Continue, but log the error
			} else {
				console.log(`[DEBUG] Profile created for new user ${new_user_id} with ${INITIAL_POINTS_BONUS} points.`);
			}
		}

		// Return Supabase's own session + token
		res.json({ session: data.session, user: data.user });

	} catch (err) {
		console.error("[ERROR] signup exception:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
};

// --------- Email/Password Login ---------
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ error: "Email and password required" });

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) return res.status(400).json({ error: error.message });

		console.log("[DEBUG] Login Supabase user object:", data.user);

		// Return Supabase session + token
		res.json({ session: data.session, user: data.user });

	} catch (err) {
		console.error("[ERROR] login exception:", err);
		res.status(500).json({ error: "Something went wrong" });
	}
};

// --------- Social Login Redirect (No change needed here) ---------
export const socialLoginRedirect = async (req, res) => {
	const provider = req.params.provider;
	if (!provider) return res.status(400).send("Provider is required");

	try {
		console.log("[DEBUG] Redirecting to Supabase OAuth provider:", provider);

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options: { redirectTo: process.env.SUPABASE_REDIRECT_URL }
		});

		if (error) return res.status(400).send(error.message);

		console.log("[DEBUG] Supabase OAuth URL:", data.url);
		res.redirect(data.url);

	} catch (err) {
		console.error("[ERROR] socialLoginRedirect exception:", err);
		res.status(500).send(err.message);
	}
};

// --------- Exchange OAuth access_token for session ---------
export const oauthExchange = async (req, res) => {
	try {
		const { access_token } = req.body;
		if (!access_token) return res.status(400).json({ error: "Access token required" });

		const { data: { user }, error } = await supabase.auth.getUser(access_token);
		if (error || !user) return res.status(400).json({ error: error?.message || "Invalid token" });

		console.log("[DEBUG] OAuth Supabase user object:", user);

		// Ensure profile exists AND grant initial points
		const { data: profile } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		if (!profile) {
			const full_name = user.user_metadata.full_name || user.email;
			
			const { error: insertError } = await supabase.from("profiles").insert([
				{ 
					id: user.id, 
					full_name: full_name,
					// 💡 FIX: Grant initial points here
					total_points: INITIAL_POINTS_BONUS 
				}
			]);
			
			if (insertError) {
				console.error("[ERROR] Profile insertion failed for OAuth with initial points:", insertError);
			} else {
				console.log(`[DEBUG] Profile created for OAuth user ${user.id} with ${INITIAL_POINTS_BONUS} points.`);
			}
		}

		// ✅ No custom JWT — return the Supabase token
		res.json({ user });

	} catch (err) {
		console.error("[ERROR] oauthExchange exception:", err);
		res.status(500).json({ error: err.message });
	}
};

// --------- Get Current User (from Supabase) ---------
export const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: authError?.message || "Invalid token" });
    }

    console.log("[DEBUG] Current Supabase user:", user);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[ERROR] Profile fetch error:", profileError);
      return res.status(404).json({ error: "Profile not found" });
    }

    // Normalize avatar URL
    let avatar_url = profile.avatar_url;
    if (avatar_url) {
      if (!avatar_url.startsWith("http")) {
        // Clean leading slashes and ensure proper bucket path
        const cleanPath = avatar_url
          .replace(/^\/+/, "")
          .replace(/^uploads\//, "")
          .replace(/^avatars\//, "avatars/");

        avatar_url = `https://jwkxwvtrjivhktqovxwh.supabase.co/storage/v1/object/public/${cleanPath}`;
      }
    } else {
      // Default avatar if missing
      avatar_url = `https://i.pravatar.cc/150?u=${user.id}`;
    }

    // Send response
    res.json({
      id: user.id,
      email: user.email,
      full_name: profile.full_name,
      bio: profile.bio,
      skills_offered: profile.skills_offered,
      skills_wanted: profile.skills_wanted,
      total_points: profile.total_points,
      role: profile.role,
      avatar_url, // ✅ always valid
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });

  } catch (err) {
    console.error("[ERROR] /me exception:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
