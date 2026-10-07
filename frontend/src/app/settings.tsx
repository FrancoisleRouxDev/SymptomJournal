import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Moon,
  Shield,
  Download,
  LogOut,
  Info,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { signOut } from '@/lib/auth';

export default function SettingsScreen() {
  const router = useRouter();

  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [insightAlertsEnabled, setInsightAlertsEnabled] = useState(true);

  // Appearance toggles
  const [darkMode, setDarkMode] = useState(false);

  // Privacy toggles
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [shareAnonymous, setShareAnonymous] = useState(false);

  const handleExportData = () => {
    Alert.alert(
      'Export Health Data',
      'Your symptom logs and AI summaries will be compiled into a structured JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            Alert.alert('Data Exported', 'Your data export has been prepared successfully.');
          },
        },
      ]
    );
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
            await signOut();
            router.replace('/auth/sign-in' as any);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={Colors.neutral.brown} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SECTION: NOTIFICATIONS */}
          <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
          <View style={styles.cardGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Daily symptom reminders</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#E5DC CF', true: Colors.sage.base }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Log Reminders</Text>
                <Text style={styles.settingSubtitle}>Nudges to log how you feel</Text>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={setRemindersEnabled}
                trackColor={{ false: '#E5DC CF', true: Colors.sage.base }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>AI Insight Alerts</Text>
                <Text style={styles.settingSubtitle}>When new patterns are found</Text>
              </View>
              <Switch
                value={insightAlertsEnabled}
                onValueChange={setInsightAlertsEnabled}
                trackColor={{ false: '#E5DC CF', true: Colors.sage.base }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* SECTION: APPEARANCE */}
          <Text style={styles.sectionHeader}>APPEARANCE</Text>
          <View style={styles.cardGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E5DC CF', true: Colors.sage.base }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Alert.alert('Text Size', 'Dynamic type is set to system standard.')}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Text Size</Text>
              </View>
              <View style={styles.rightNavRow}>
                <Text style={styles.rightNavText}>Default</Text>
                <ChevronRight size={16} color={Colors.neutral.muted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* SECTION: PRIVACY & SECURITY */}
          <Text style={styles.sectionHeader}>PRIVACY &amp; SECURITY</Text>
          <View style={styles.cardGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Biometric Lock</Text>
                <Text style={styles.settingSubtitle}>Face ID / Touch ID</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#E5DC CF', true: Colors.sage.base }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Share Anonymous Data</Text>
                <Text style={styles.settingSubtitle}>Help improve SymptomJournal</Text>
              </View>
              <Switch
                value={shareAnonymous}
                onValueChange={setShareAnonymous}
                trackColor={{ false: '#E5DC CF', true: Colors.sage.base }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleExportData}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Export My Data</Text>
              </View>
              <ChevronRight size={16} color={Colors.neutral.muted} />
            </TouchableOpacity>
          </View>

          {/* SECTION: ABOUT */}
          <Text style={styles.sectionHeader}>ABOUT</Text>
          <View style={styles.cardGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Version</Text>
              </View>
              <Text style={styles.rightNavText}>1.0.0 (Build 42)</Text>
            </View>
          </View>

          {/* SIGN OUT BUTTON */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <LogOut size={18} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.signOutButtonText}>Sign Out of Account</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
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
    backgroundColor: '#EAE1D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 26,
    color: Colors.neutral.brown,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.neutral.muted,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  cardGroup: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: '#EDE5D8',
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
    fontSize: 14.5,
    color: Colors.neutral.brown,
  },
  settingSubtitle: {
    fontFamily: 'Nunito-Medium',
    fontSize: 12,
    color: Colors.neutral.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E8DC',
  },
  rightNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightNavText: {
    fontFamily: 'Nunito-Medium',
    fontSize: 13,
    color: Colors.neutral.muted,
  },
  signOutButton: {
    backgroundColor: Colors.terracotta.base,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.terracotta.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.button,
    color: Colors.white,
  },
});
