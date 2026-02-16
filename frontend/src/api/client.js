import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a response interceptor to handle common errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized, etc.
    if (error.response && error.response.status === 401) {
      // potentially redirect to login or refresh token
      console.warn("Unauthorized access");
    }
    return Promise.reject(error);
  },
);

// Add a request interceptor to inject the Supabase token
client.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error("Error fetching session for API call:", error);
  }
  return config;
});

export default client;
