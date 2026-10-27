import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_CHANNEL_ID = 'daily-reminders';

// Shared with the Settings screen, which writes these preferences
export const NOTIFICATION_SETTINGS_KEY = 'settings_notifications';
export const DEFAULT_REMINDER_TIME = { hour: 20, minute: 0, label: '8:00 PM' };

// Safe lazy accessor for expo-notifications to prevent web/build crashes
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && Notifications.setNotificationHandler) {
    // shouldShowAlert is deprecated since SDK 53; without shouldShowBanner /
    // shouldShowList, notifications that arrive while the app is open don't show
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  // Expo notifications not available or in web context
}

/**
 * Configure Android notification channels and request OS permission
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Daily Symptom Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5A7D66',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log('[Notifications] OS permission status:', finalStatus);
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[Notifications] Error registering for push notifications:', err);
    return false;
  }
}

/**
 * Schedule a daily reminder notification
 */
export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;

  try {
    // Cancel existing scheduled notifications first to prevent duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // DailyTriggerInput repeats by definition and only accepts type/hour/minute/channelId
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Symptom Check-in 🌿',
        body: 'How is your body feeling today? Take 30 seconds to log your symptoms.',
        data: { screen: 'log' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    console.log(`[Notifications] Daily reminder scheduled for ${hour}:${minute.toString().padStart(2, '0')} (ID: ${notifId})`);
  } catch (err) {
    console.warn('[Notifications] Error scheduling daily reminder:', err);
  }
}

/**
 * Cancel all scheduled reminders
 */
export async function cancelDailyReminder(): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cancelled all scheduled reminders');
  } catch (err) {
    console.warn('[Notifications] Error cancelling daily reminder:', err);
  }
}

/**
 * Schedule (or clear) the daily reminder to match the saved Settings.
 * Settings shows reminders as on at 8:00 PM by default, so without this a user
 * who never touched the switch would never get a reminder. Safe to call on
 * every launch: scheduling replaces any existing reminder.
 */
export async function syncDailyReminderFromSettings(): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    const enabled = (saved.push ?? true) && (saved.reminders ?? true);
    if (!enabled) {
      await cancelDailyReminder();
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const time = saved.reminderTime ?? DEFAULT_REMINDER_TIME;
    await scheduleDailyReminder(time.hour, time.minute);
  } catch (err) {
    console.warn('[Notifications] Error syncing daily reminder:', err);
  }
}

/**
 * Check currently scheduled notifications (useful for debugging)
 */
export async function checkScheduledRemindersAsync(): Promise<any[]> {
  if (!Notifications || Platform.OS === 'web') return [];
  try {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[Notifications] Currently scheduled count:', list.length, list);
    return list;
  } catch (err) {
    console.warn('[Notifications] Error checking scheduled notifications:', err);
    return [];
  }
}

/**
 * Send an immediate test notification (fires in 4-5 seconds)
 */
export async function sendTestNotificationAsync(seconds = 4): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;
  try {
    const granted = await registerForPushNotificationsAsync();
    if (!granted) return false;

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Symptom Check-in 🌿',
        body: 'How is your body feeling right now? Take 30 seconds to log your symptoms.',
        data: { screen: 'log' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
        repeats: false,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    console.log('[Notifications] Test notification scheduled with id:', notifId);
    return true;
  } catch (err) {
    console.warn('[Notifications] Error triggering test notification:', err);
    return false;
  }
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string; // 'daily_reminder' | 'pattern_alert' | 'system'
  title: string;
  message: string;
  read: boolean;
  sent_at: string;
}

// The live notifications table only stores id, user_id, type, read and sent_at,
// so the display text is derived from the type. Stored text wins if those
// columns are added later.
const NOTIFICATION_CONTENT: Record<string, { title: string; message: string }> = {
  daily_reminder: {
    title: 'Daily Symptom Check-in',
    message: 'How is your body feeling today? Log symptoms calmly to keep your health timeline updated.',
  },
  system: {
    title: 'Welcome to SymptomJournal',
    message: 'Track symptoms, spot correlations across time, and export clear reports for your doctor.',
  },
  pattern_alert: {
    title: 'New pattern spotted',
    message: 'Your AI insights have been updated. Open Insights to see what changed.',
  },
};

function withContent(row: any): AppNotification {
  const fallback = NOTIFICATION_CONTENT[row.type] ?? NOTIFICATION_CONTENT.system;
  return {
    ...row,
    title: row.title ?? fallback.title,
    message: row.message ?? fallback.message,
  };
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
      return data.map(withContent);
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
    // sent_at has no default in the live table, so set it explicitly
    const sentAt = new Date().toISOString();
    const rows = [
      { user_id: userId, type: 'daily_reminder', read: false, sent_at: sentAt },
      { user_id: userId, type: 'system', read: false, sent_at: sentAt },
    ];

    const { data } = await supabase.from('notifications').insert(rows).select('*');
    return (data || []).map(withContent);
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
 * Its text comes from NOTIFICATION_CONTENT for the given type.
 */
export async function createNotification(type = 'pattern_alert'): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return;

    await supabase.from('notifications').insert([
      { user_id: user.id, type, read: false, sent_at: new Date().toISOString() },
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
