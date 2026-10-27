import { AppState } from 'react-native';
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://uzopbhizwlgenibqriue.supabase.co';
const supabaseKey =
    process.env.EXPO_PUBLIC_SUPABASE_KEY ||
    'sb_publishable_pVrpEbkP06HyyZ69hrDz0Q_bhoCHD4f';

// Static web rendering runs in Node, where AsyncStorage's localStorage backend
// doesn't exist. Skip session persistence there; the browser takes over on load.
const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: isServer ? undefined : AsyncStorage,
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: false,
    },
});

// Tells Supabase Auth to refresh the session automatically whenever the app is active/opened
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
