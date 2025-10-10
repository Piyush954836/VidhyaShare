import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const API_URL = "http://localhost:5000"; // backend
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export const registerUser = async (name, email, password) => {
  const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
  return res.data;
};

// Social login
export const socialLogin = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) throw error.message;

  // After successful login, supabase returns session & user
  // You can send this info to backend to generate JWT if needed
  const token = data.session?.access_token; 
  return { token, user: data.user };
};
