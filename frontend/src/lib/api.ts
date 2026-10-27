import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://symptomjournal.onrender.com';

// AI endpoints call an external model, so they get longer than the default
// timeout; this stays above the backend's own AI timeout (~40s worst case)
export const AI_TIMEOUT_MS = 45000;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Auto-attach Supabase JWT token to every request
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 429) {
            throw new Error('Too many requests — please wait a moment and try again.');
        }
        if (error.response?.status === 401) {
            throw new Error('Session expired — please sign in again.');
        }
        throw error;
    }
);

/**
 * Fire-and-forget ping so a sleeping Render instance starts waking up
 * while the user is still on Home, before they reach an AI screen.
 */
export function warmUpBackend(): void {
    api.get('/ping', { timeout: 60000 }).catch(() => {});
}

export default api;