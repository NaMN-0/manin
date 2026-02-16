import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15s timeout to prevent hanging
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
  // If Authorization header is already set (e.g., passed explicitly), skip Supabase session check
  if (config.headers.Authorization) {
    return config;
  }

  try {
    // Only attempt to get session if we are not already processing a clear guest request
    // This prevents infinite loops or aborts during initial load
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch (error) {
    // Squelch errors to allow public endpoints (like market overview) to work even if auth fails
    // console.warn("Auth interceptor warning:", error);
  }
  return config;
});

export default client;
