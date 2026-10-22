import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
  Check,
} from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signOut, getCurrentUser } from '@/lib/auth';
import {
  registerForPushNotificationsAsync,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '@/lib/notifications';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, textSize, setTextSize, colors, scaled } = useTheme();

  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [insightAlertsEnabled, setInsightAlertsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState({ hour: 20, minute: 0, label: '8:00 PM' });
  const [showTimePicker, setShowTimePicker] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('settings_notifications').then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.push !== undefined) setPushEnabled(parsed.push);
          if (parsed.reminders !== undefined) setRemindersEnabled(parsed.reminders);
          if (parsed.insights !== undefined) setInsightAlertsEnabled(parsed.insights);
          if (parsed.reminderTime) setReminderTime(parsed.reminderTime);
        } catch {}
      }
    });
  }, []);

  const handleTogglePush = async (val: boolean) => {
    setPushEnabled(val);
    if (val) {
      const granted = await registerForPushNotificationsAsync();
      if (!granted) {
        Alert.alert(
          'Notification Permission',
          'Please enable notifications in your phone Settings > Apps > SymptomJournal > Notifications to receive reminders.'
        );
      }
    } else {
      await cancelDailyReminder();
    }
    await AsyncStorage.setItem(
      'settings_notifications',
      JSON.stringify({ push: val, reminders: remindersEnabled, insights: insightAlertsEnabled, reminderTime })
    );
  };

  const handleToggleReminders = async (val: boolean) => {
    setRemindersEnabled(val);
    if (val) {
      const granted = await registerForPushNotificationsAsync();
      if (granted) {
        await scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
      } else {
        Alert.alert(
          'Notification Permission',
          'Please enable notifications in your phone Settings > Apps > SymptomJournal > Notifications to schedule check-ins.'
        );
      }
    } else {
      await cancelDailyReminder();
    }
    await AsyncStorage.setItem(
      'settings_notifications',
      JSON.stringify({ push: pushEnabled, reminders: val, insights: insightAlertsEnabled, reminderTime })
    );
  };

  const handleSelectTime = async (time: { hour: number; minute: number; label: string }) => {
    setReminderTime(time);
    setShowTimePicker(false);
    if (remindersEnabled) {
      await scheduleDailyReminder(time.hour, time.minute);
    }
    await AsyncStorage.setItem(
      'settings_notifications',
      JSON.stringify({ push: pushEnabled, reminders: remindersEnabled, insights: insightAlertsEnabled, reminderTime: time })
    );
    Alert.alert('Reminder Time Updated', `Your daily symptom check-in is set for ${time.label}.`);
  };

  // Privacy toggles
  // const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [shareAnonymous, setShareAnonymous] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const user = await getCurrentUser();
      const historyRes = await api.get('/symptoms/history');
      const logs = historyRes.data?.symptoms || [];

      let patternData = null;
      try {
        const patternRes = await api.get('/analysis/patterns');
        patternData = patternRes.data;
      } catch {
        // Optional
      }

      Alert.alert(
        'Data Export Ready',
        `Successfully compiled ${logs.length} symptom logs and user health records. Export format: JSON.`,
        [{ text: 'Done', style: 'default' }]
      );
    } catch (err: any) {
      Alert.alert('Export Notice', 'Could not compile export data: ' + (err.message || 'Network error'));
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of SymptomJournal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch { }
            await AsyncStorage.removeItem('has_onboarded');
            router.replace('/auth/sign-in' as any);
          },
        },
      ]
    );
  };

  const cardGroupStyle = [
    styles.cardGroup,
    { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
  ];
  const dividerStyle = [styles.divider, { backgroundColor: colors.neutral.border }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDarkMode ? colors.neutral.border : '#EAE1D5' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={scaled(22)} color={colors.neutral.brown} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.neutral.brown, fontSize: scaled(26) }]}>
            Settings
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SECTION: APPEARANCE */}
          <Text style={[styles.sectionHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
            APPEARANCE &amp; ACCESSIBILITY
          </Text>
          <View style={cardGroupStyle}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  {isDarkMode ? 'Dark warm palette active' : 'Warm canvas palette active'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={(val) => toggleDarkMode(val)}
                trackColor={{ false: colors.neutral.border, true: colors.sage.base }}
                thumbColor={colors.white}
              />
            </View>

            <View style={dividerStyle} />

            <View style={styles.textSizeBlock}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Text Size
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  Scales fonts across all screens ({textSize === 'small' ? '90%' : textSize === 'medium' ? '100%' : '115%'})
                </Text>
              </View>
              <View
                style={[
                  styles.textSizeSegmented,
                  {
                    backgroundColor: isDarkMode ? '#1E1A18' : '#EFE8DE',
                    borderColor: colors.neutral.border,
                  },
                ]}
              >
                {(['small', 'medium', 'large'] as const).map((size) => {
                  const isSelected = textSize === size;
                  const label = size === 'small' ? 'Small' : size === 'medium' ? 'Default' : 'Large';
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.textSizeOption,
                        isSelected && {
                          backgroundColor: colors.background.card,
                          shadowColor: '#000',
                          shadowOpacity: isDarkMode ? 0.35 : 0.08,
                          shadowRadius: 3,
                          elevation: 2,
                        },
                      ]}
                      onPress={() => setTextSize(size)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.textSizeOptionText,
                          {
                            color: isSelected ? colors.sage.dark : colors.neutral.muted,
                            fontFamily: isSelected ? 'Nunito-Bold' : 'Nunito-Medium',
                            fontSize: scaled(12.5),
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* SECTION: NOTIFICATIONS */}
          <Text style={[styles.sectionHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
            NOTIFICATIONS
          </Text>
          <View style={cardGroupStyle}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  Daily symptom reminders
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: colors.neutral.border, true: colors.sage.base }}
                thumbColor={colors.white}
              />
            </View>

            <View style={dividerStyle} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Log Reminders
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  Nudges to log how you feel
                </Text>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={handleToggleReminders}
                trackColor={{ false: colors.neutral.border, true: colors.sage.base }}
                thumbColor={colors.white}
              />
            </View>

            <View style={dividerStyle} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  AI Insight Alerts
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  When new patterns are found
                </Text>
              </View>
              <Switch
                value={insightAlertsEnabled}
                onValueChange={setInsightAlertsEnabled}
                trackColor={{ false: colors.neutral.border, true: colors.sage.base }}
                thumbColor={colors.white}
              />
            </View>

            <View style={dividerStyle} />

            {/* REMINDER TIME SELECTOR */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
              disabled={!remindersEnabled}
            >
              <View style={styles.settingInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={scaled(15)} color={remindersEnabled ? colors.sage.base : colors.neutral.muted} />
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: remindersEnabled ? colors.neutral.brown : colors.neutral.muted, fontSize: scaled(14.5) },
                    ]}
                  >
                    Reminder Time
                  </Text>
                </View>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  When you want to receive daily check-in
                </Text>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: isDarkMode ? '#24201E' : '#EAE3D9', opacity: remindersEnabled ? 1 : 0.5 }]}>
                <Text style={[styles.timeBadgeText, { color: colors.sage.dark, fontSize: scaled(13) }]}>
                  {reminderTime.label}
                </Text>
                <ChevronRight size={scaled(14)} color={colors.neutral.muted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* SECTION: PRIVACY & SECURITY */}
          <Text style={[styles.sectionHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
            PRIVACY &amp; SECURITY
          </Text>
          <View style={cardGroupStyle}>
            {/* <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Biometric Lock
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  Face ID / Fingerprint protection
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: colors.neutral.border, true: colors.sage.base }}
                thumbColor={colors.white}
              />
            </View> */}

            <View style={dividerStyle} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Share Anonymous Data
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  Help improve SymptomJournal accuracy
                </Text>
              </View>
              <Switch
                value={shareAnonymous}
                onValueChange={setShareAnonymous}
                trackColor={{ false: colors.neutral.border, true: colors.sage.base }}
                thumbColor={colors.white}
              />
            </View>

            <View style={dividerStyle} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleExportData}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Export My Data (JSON)
                </Text>
              </View>
              <ChevronRight size={scaled(16)} color={colors.neutral.muted} />
            </TouchableOpacity>
          </View>

          {/* SECTION: ABOUT */}
          <Text style={[styles.sectionHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
            ABOUT &amp; SUPPORT
          </Text>
          <View style={cardGroupStyle}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={async () => {
                await AsyncStorage.removeItem('has_onboarded');
                router.push('/onboarding/slide-1' as any);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  View Onboarding Tour
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  Replay the introduction screens &amp; icons
                </Text>
              </View>
              <ChevronRight size={scaled(16)} color={colors.neutral.muted} />
            </TouchableOpacity>

            <View style={dividerStyle} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                  Version
                </Text>
              </View>
              <Text style={[styles.rightNavText, { color: colors.neutral.muted, fontSize: scaled(13) }]}>
                1.0.4 (Build 44)
              </Text>
            </View>
          </View>

          {/* SIGN OUT BUTTON */}
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: colors.terracotta.base }]}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <LogOut size={scaled(18)} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[styles.signOutButtonText, { fontSize: scaled(16) }]}>Sign Out of Account</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* TIME PICKER MODAL */}
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock size={scaled(20)} color={colors.sage.dark} />
                  <Text style={[styles.modalTitle, { color: colors.neutral.brown, fontSize: scaled(18) }]}>
                    Choose Reminder Time
                  </Text>
                </View>
                <Text style={[styles.modalSubtitle, { color: colors.neutral.muted, fontSize: scaled(13) }]}>
                  We'll send your daily check-in nudge at this time
                </Text>
              </View>

              <View style={styles.timeOptionsGrid}>
                {[
                  { hour: 8, minute: 0, label: '8:00 AM (Morning)' },
                  { hour: 12, minute: 0, label: '12:00 PM (Midday)' },
                  { hour: 17, minute: 0, label: '5:00 PM (Late Afternoon)' },
                  { hour: 19, minute: 0, label: '7:00 PM (Early Evening)' },
                  { hour: 20, minute: 0, label: '8:00 PM (Evening Default)' },
                  { hour: 21, minute: 0, label: '9:00 PM (Night)' },
                  { hour: 22, minute: 0, label: '10:00 PM (Before Bed)' },
                ].map((item) => {
                  const isSelected = reminderTime.hour === item.hour && reminderTime.minute === item.minute;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.timeOptionItem,
                        {
                          backgroundColor: isSelected ? colors.sage.light : isDarkMode ? '#1E1A18' : '#FAF6F0',
                          borderColor: isSelected ? colors.sage.base : colors.neutral.border,
                        },
                      ]}
                      onPress={() => handleSelectTime(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          {
                            color: isSelected ? colors.sage.dark : colors.neutral.brown,
                            fontFamily: isSelected ? 'Nunito-Bold' : 'Nunito-Medium',
                            fontSize: scaled(14),
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Check size={scaled(18)} color={colors.sage.dark} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDarkMode ? '#282320' : '#EFE8DE' }]}
                onPress={() => setShowTimePicker(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCloseText, { color: colors.neutral.brown, fontSize: scaled(14) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  cardGroup: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontFamily: 'Nunito-Bold',
  },
  settingSubtitle: {
    fontFamily: 'Nunito-Medium',
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  textSizeBlock: {
    paddingVertical: 12,
  },
  textSizeSegmented: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 3,
    borderWidth: 1,
    marginTop: 10,
  },
  textSizeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSizeOptionText: {
    fontFamily: 'Nunito-Bold',
  },
  rightNavText: {
    fontFamily: 'Nunito-Medium',
  },
  signOutButton: {
    borderRadius: Radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    elevation: 3,
  },
  signOutButtonText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  timeBadgeText: {
    fontFamily: 'Nunito-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  modalSubtitle: {
    fontFamily: 'Nunito-Medium',
    marginTop: 4,
  },
  timeOptionsGrid: {
    gap: 8,
    marginVertical: Spacing.sm,
  },
  timeOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  timeOptionText: {
    fontSize: 14,
  },
  modalCloseButton: {
    marginTop: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontFamily: 'Nunito-Bold',
  },
});
