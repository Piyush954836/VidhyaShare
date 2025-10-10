import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config(); // only needed for local dev

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
