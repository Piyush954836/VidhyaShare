import axios from "axios";

// Get API URL from Vite environment variable
const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL, // your backend URL (dynamic)
});

export default axiosInstance;
