import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is missing. Check your .env file");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
