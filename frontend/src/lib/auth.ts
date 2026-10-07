import { supabase } from './supabase';

export async function signUp(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function updateUserProfile(attributes: {
    name?: string;
    phone?: string;
    dob?: string;
    doctor?: string;
    conditions?: string;
}) {
    const { data, error } = await supabase.auth.updateUser({
        data: attributes,
    });
    if (error) throw error;
    return data;
}