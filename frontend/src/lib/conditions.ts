import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_CONDITIONS_KEY = '@symptomjournal_conditions';

export interface CommonConditionRow {
  id: string;
  user_id: string;
  condition_name: string;
  noted_at: string;
}

/**
 * Fetch conditions from Supabase public.common_conditions table.
 * Falls back to local AsyncStorage if offline or guest.
 */
export async function fetchCommonConditions(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (user?.id) {
      const { data, error } = await supabase
        .from('common_conditions')
        .select('condition_name')
        .eq('user_id', user.id)
        .order('noted_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const names = data.map((row: any) => row.condition_name.trim()).filter(Boolean);
        // Sync to AsyncStorage for offline access
        await AsyncStorage.setItem(STORAGE_CONDITIONS_KEY, names.join(', '));
        return names;
      }
    }
  } catch (err) {
    console.log('Error fetching from common_conditions:', err);
  }

  // Fallback to AsyncStorage
  const local = await AsyncStorage.getItem(STORAGE_CONDITIONS_KEY);
  if (local && local !== 'None recorded' && local !== 'Not set') {
    return local.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Persist conditions to Supabase public.common_conditions table and local storage.
 * Handles comma-separated string or array of strings.
 */
export async function saveCommonConditions(conditionsInput: string | string[]): Promise<string[]> {
  const list = Array.isArray(conditionsInput)
    ? conditionsInput.map((c) => c.trim()).filter(Boolean)
    : conditionsInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

  const formattedStr = list.length > 0 ? list.join(', ') : 'None recorded';
  await AsyncStorage.setItem(STORAGE_CONDITIONS_KEY, formattedStr);

  try {
    const user = await getCurrentUser();
    if (user?.id) {
      // 1. Clear existing condition rows for this user
      await supabase.from('common_conditions').delete().eq('user_id', user.id);

      // 2. Insert new condition rows if any
      if (list.length > 0) {
        const rows = list.map((name) => ({
          user_id: user.id,
          condition_name: name,
        }));
        await supabase.from('common_conditions').insert(rows);
      }
    }
  } catch (err) {
    console.log('Error saving to common_conditions in Supabase:', err);
  }

  return list;
}
