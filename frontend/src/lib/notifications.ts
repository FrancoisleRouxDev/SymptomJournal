import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string; // 'daily_reminder' | 'pattern_alert' | 'system'
  title: string;
  message: string;
  read: boolean;
  sent_at: string;
}

/**
 * Fetch all notifications for the currently logged in user from Supabase.
 * If none exist, seeds an initial friendly check-in reminder.
 */
export async function fetchUserNotifications(): Promise<AppNotification[]> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false });

    if (!error && data) {
      if (data.length === 0) {
        // Seed default initial notifications so user sees immediate value
        const initial = await seedDefaultNotifications(user.id);
        return initial;
      }
      return data as AppNotification[];
    }
  } catch (err) {
    console.log('Error fetching notifications:', err);
  }
  return [];
}

/**
 * Seeds friendly default welcome and reminder notices into Supabase.
 */
export async function seedDefaultNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const rows = [
      {
        user_id: userId,
        type: 'daily_reminder',
        title: 'Daily Symptom Check-in',
        message: 'How is your body feeling today? Log symptoms calmly to keep your health timeline updated.',
        read: false,
      },
      {
        user_id: userId,
        type: 'system',
        title: 'Welcome to SymptomJournal',
        message: 'Track symptoms, spot correlations across time, and export clear reports for your doctor.',
        read: false,
      },
    ];

    const { data } = await supabase.from('notifications').insert(rows).select('*');
    return (data || []) as AppNotification[];
  } catch (err) {
    console.log('Error seeding notifications:', err);
    return [];
  }
}

/**
 * Marks a notification as read in Supabase.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  } catch (err) {
    console.log('Error marking notification as read:', err);
  }
}

/**
 * Creates a new notification (e.g., when an AI pattern is recognized).
 */
export async function createNotification(
  title: string,
  message: string,
  type = 'pattern_alert'
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return;

    await supabase.from('notifications').insert([
      {
        user_id: user.id,
        title,
        message,
        type,
        read: false,
      },
    ]);
  } catch (err) {
    console.log('Error creating notification:', err);
  }
}

/**
 * Deletes a notification from Supabase.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await supabase.from('notifications').delete().eq('id', notificationId);
  } catch (err) {
    console.log('Error deleting notification:', err);
  }
}
