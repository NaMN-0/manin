import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://manin-api.onrender.com', // Fallback to prod
    timeout: 120000, // 2 min for heavy scans
});

// Auto-attach auth token
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export default api;
