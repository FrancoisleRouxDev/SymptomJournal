import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

export default api;