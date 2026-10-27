import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Spacing, Radius } from '@/constants/theme';
import { getCurrentUser, signOut, updateUserProfile } from '@/lib/auth';
import {
  Settings,
  Flame,
  ClipboardList,
  Target,
  Leaf,
  Trophy,
  Sparkles,
  Pencil,
  Check,
  X,
  Moon,
  UserCheck,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import api from '@/lib/api';
import { timestampDateKey } from '@/lib/dates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCommonConditions, saveCommonConditions } from '@/lib/conditions';

const STORAGE_DOCTOR = '@symptomjournal_doctor';
const STORAGE_CONDITIONS = '@symptomjournal_conditions';

const DEFAULT_ACHIEVEMENTS = [
  { id: 'streak_7', title: '7-Day Streak', icon: Flame, minDays: 7 },
  { id: 'entries_50', title: '50 Entries', icon: ClipboardList, minEntries: 50 },
  { id: 'pattern_spotter', title: 'Pattern Spotter', icon: Target, minEntries: 3 },
  { id: 'streak_30', title: '30-Day Streak', icon: Leaf, minDays: 30 },
  { id: 'entries_100', title: '100 Entries', icon: Trophy, minEntries: 100 },
  { id: 'ai_explorer', title: 'AI Explorer', icon: Sparkles, minEntries: 3 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode, toggleDarkMode, scaled } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [entriesCount, setEntriesCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [symptomTypesCount, setSymptomTypesCount] = useState(0);

  // Editable health info (empty by default)
  const [doctorName, setDoctorName] = useState('');
  const [conditions, setConditions] = useState('');

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [draftDoctor, setDraftDoctor] = useState('');
  const [draftConditions, setDraftConditions] = useState('');
  const [savingHealth, setSavingHealth] = useState(false);

  const loadUserProfileAndStats = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const savedDoctor = await AsyncStorage.getItem(STORAGE_DOCTOR);
      // Prioritize saved doctor or metadata (empty by default, filter legacy 'Not set')
      const rawDoctor = savedDoctor !== null ? savedDoctor : (currentUser?.user_metadata?.doctor || '');
      const initialDoctor = rawDoctor && rawDoctor !== 'Not set' ? rawDoctor : '';
      setDoctorName(initialDoctor);

      // 1. Fetch conditions from Supabase public.common_conditions table
      try {
        const supabaseConditions = await fetchCommonConditions();
        if (supabaseConditions && supabaseConditions.length > 0) {
          setConditions(supabaseConditions.join(', '));
        } else {
          const savedConditions = await AsyncStorage.getItem(STORAGE_CONDITIONS);
          const rawConditions = savedConditions !== null ? savedConditions : (currentUser?.user_metadata?.conditions || '');
          const initialConditions = rawConditions && rawConditions !== 'Not set' ? rawConditions : '';
          setConditions(initialConditions);
        }
      } catch (condErr) {
        console.log('Error loading common conditions from Supabase:', condErr);
      }

      const res = await api.get('/symptoms/history');
      const logs: any[] = res.data?.symptoms || [];
      setEntriesCount(logs.length);

      const uniqueDays = new Set<string>();
      const uniqueTypes = new Set<string>();
      logs.forEach((log) => {
        if (log.created_at) uniqueDays.add(timestampDateKey(log.created_at));
        const desc = (log.description || 'General').replace(/\s*\(.*?\)/, '').trim();
        if (desc) uniqueTypes.add(desc);
      });
      setDaysActive(uniqueDays.size || (logs.length > 0 ? 1 : 0));
      setSymptomTypesCount(uniqueTypes.size);
    } catch (error) {
      console.log('Error loading profile & stats:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserProfileAndStats();
    }, [])
  );

  const openHealthEditModal = () => {
    setDraftDoctor(doctorName === 'Not set' ? '' : doctorName);
    setDraftConditions(conditions === 'None recorded' || conditions === 'Not set' ? '' : conditions);
    setIsEditModalVisible(true);
  };

  const handleSaveHealthDetails = async () => {
    setSavingHealth(true);
    try {
      const trimmedDoc = draftDoctor.trim();
      const trimmedCond = draftConditions.trim() || 'None recorded';

      // 1. Save doctor info to local storage & auth metadata
      await AsyncStorage.setItem(STORAGE_DOCTOR, trimmedDoc);
      try {
        await updateUserProfile({
          doctor: trimmedDoc,
          conditions: trimmedCond,
        });
      } catch (e) {
        console.log('Remote profile update note:', e);
      }

      // 2. Persist conditions into Supabase public.common_conditions table
      await saveCommonConditions(trimmedCond);

      setDoctorName(trimmedDoc);
      setConditions(trimmedCond);
      setIsEditModalVisible(false);
      Alert.alert('Details Saved', 'Clinical conditions and preferences updated in Supabase.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save health details.');
    } finally {
      setSavingHealth(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
    ]);
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const initial = userName.charAt(0).toUpperCase();

  const achievementsWithStatus = DEFAULT_ACHIEVEMENTS.map((item) => {
    let earned = false;
    if (item.minDays && daysActive >= item.minDays) earned = true;
    else if (item.minEntries && entriesCount >= item.minEntries) earned = true;
    return { ...item, earned };
  });
  const earnedCount = achievementsWithStatus.filter((a) => a.earned).length;

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: scaled(26), color: colors.neutral.brown }}>
              Profile
            </Text>
            <TouchableOpacity
              style={[styles.gearBtn, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}
              onPress={() => router.push('/settings' as any)}
              activeOpacity={0.7}
            >
              <Settings size={scaled(18)} color={colors.neutral.brown} />
            </TouchableOpacity>
          </View>

          {/* Profile Hero Card */}
          <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#203025' : '#5C7C67' }]}>
            <View style={styles.avatarCircle}>
              <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: scaled(28), color: '#FFF' }}>
                {initial}
              </Text>
            </View>
            <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: scaled(22), color: '#FFF' }}>
              {userName}
            </Text>
            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(12), color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {userEmail}
            </Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/profile/edit' as any)}
              activeOpacity={0.8}
            >
              <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(12), color: '#FFF' }}>
                Edit Full Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Health Overview — Prominent & Easy to Edit */}
          <View style={cardStyle}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <UserCheck size={scaled(16)} color={colors.sage.dark} />
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(15), color: colors.neutral.brown }}>
                  Clinical &amp; Health Info
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.editHealthBadge, { backgroundColor: colors.sage.tint }]}
                onPress={openHealthEditModal}
                activeOpacity={0.7}
              >
                <Pencil size={scaled(12)} color={colors.sage.dark} style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(12), color: colors.sage.dark }}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Doctor Row - Tappable */}
            <TouchableOpacity
              style={[styles.infoRow, { borderTopColor: colors.neutral.border }]}
              onPress={openHealthEditModal}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(10.5), color: colors.neutral.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    PRIMARY DOCTOR / CLINIC
                  </Text>
                  <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(9.5), color: colors.neutral.muted }}>
                      OPTIONAL
                    </Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: doctorName && doctorName !== 'Not set' ? colors.neutral.brown : colors.neutral.muted, marginTop: 3 }}>
                  {doctorName && doctorName !== 'Not set' ? doctorName : 'None / Changes as needed'}
                </Text>
              </View>
              <ChevronRight size={scaled(16)} color={colors.neutral.muted} />
            </TouchableOpacity>

            {/* Conditions Row - Tappable */}
            <TouchableOpacity
              style={[styles.infoRow, { borderTopColor: colors.neutral.border }]}
              onPress={openHealthEditModal}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(10.5), color: colors.neutral.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  TRACKED CONDITIONS
                </Text>
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: conditions ? colors.neutral.brown : colors.neutral.muted, marginTop: 3 }}>
                  {conditions || 'None recorded'}
                </Text>
              </View>
              <ChevronRight size={scaled(16)} color={colors.neutral.muted} />
            </TouchableOpacity>
          </View>

          {/* Quick Preferences: Dark Mode Toggle */}
          <View style={cardStyle}>
            <View style={styles.preferenceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.prefIconCircle, { backgroundColor: colors.background.cream }]}>
                  <Moon size={scaled(16)} color={colors.neutral.brown} />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown }}>
                    Dark Mode
                  </Text>
                  <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(11.5), color: colors.neutral.muted }}>
                    {isDarkMode ? 'Dark warm palette active' : 'Warm canvas palette active'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={(val) => toggleDarkMode(val)}
                trackColor={{ false: colors.neutral.border, true: colors.sage.base }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Entries', value: entriesCount },
              { label: 'Days Active', value: daysActive },
              { label: 'Symptom Types', value: symptomTypesCount },
            ].map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.statBox,
                  { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
                ]}
              >
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(24), color: colors.neutral.brown }}>
                  {stat.value}
                </Text>
                <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(10), color: colors.neutral.muted, marginTop: 2 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Achievements */}
          <View style={cardStyle}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown }}>
                Achievements
              </Text>
              <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(12), color: colors.sage.dark }}>
                {earnedCount} / {DEFAULT_ACHIEVEMENTS.length} earned
              </Text>
            </View>
            <View style={styles.achievementsGrid}>
              {achievementsWithStatus.map((item) => {
                const IconComp = item.icon;
                return (
                  <View key={item.id} style={[styles.achievementTile, !item.earned && { opacity: 0.45 }]}>
                    <View
                      style={[
                        styles.badgeIconBox,
                        { backgroundColor: item.earned ? colors.sage.tint : colors.background.cream },
                      ]}
                    >
                      <IconComp size={scaled(18)} color={item.earned ? colors.sage.dark : colors.neutral.muted} />
                    </View>
                    <Text
                      style={{
                        fontFamily: 'Nunito-Bold',
                        fontSize: scaled(10),
                        color: item.earned ? colors.neutral.brown : colors.neutral.muted,
                        textAlign: 'center',
                      }}
                    >
                      {item.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
            <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(16), color: '#FFF' }}>
              Sign Out of Account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* HEALTH DETAILS EDIT MODAL */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.neutral.brown, fontSize: scaled(18) }]}>
                Edit Clinical Details
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={{ padding: 4 }}>
                <X size={scaled(20)} color={colors.neutral.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.modalLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                  PRIMARY CARE DOCTOR OR CLINIC
                </Text>
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(10), color: colors.sage.dark }}>
                  OPTIONAL
                </Text>
              </View>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                    borderColor: colors.neutral.border,
                    color: colors.neutral.brown,
                    fontSize: scaled(14),
                  },
                ]}
                value={draftDoctor}
                onChangeText={setDraftDoctor}
                placeholder="e.g. Dr. Sarah Jenkins (leave empty if you switch doctors)"
                placeholderTextColor={colors.neutral.muted}
                autoFocus
              />
              <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(10.5), color: colors.neutral.muted, marginTop: 4 }}>
                Leave empty if you don't have a regular physician or move between clinics.
              </Text>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={[styles.modalLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                TRACKED CONDITIONS &amp; DIAGNOSES
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                    borderColor: colors.neutral.border,
                    color: colors.neutral.brown,
                    fontSize: scaled(14),
                  },
                ]}
                value={draftConditions}
                onChangeText={setDraftConditions}
                placeholder="e.g. Migraine, Chronic Fatigue, IBS"
                placeholderTextColor={colors.neutral.muted}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.neutral.border }]}
                onPress={() => setIsEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral.muted, fontSize: scaled(14) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.sage.dark }]}
                onPress={handleSaveHealthDetails}
                disabled={savingHealth}
                activeOpacity={0.8}
              >
                {savingHealth ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalSaveText, { fontSize: scaled(14) }]}>Save Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  gearBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  profileCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  editBtn: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  editHealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  achievementTile: { width: '30%', alignItems: 'center' },
  badgeIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutBtn: {
    backgroundColor: '#C4714F',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  modalFieldGroup: {
    marginBottom: Spacing.md,
  },
  modalLabel: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'Nunito-Medium',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modalCancelText: {
    fontFamily: 'Nunito-Bold',
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
