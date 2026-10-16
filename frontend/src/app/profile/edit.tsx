import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUser, updateUserProfile } from '@/lib/auth';

const STORAGE_DOCTOR = '@symptomjournal_doctor';
const STORAGE_CONDITIONS = '@symptomjournal_conditions';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode, scaled } = useTheme();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [doctor, setDoctor] = useState('');
  const [conditions, setConditions] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        if (user.email) setEmail(user.email);
        const meta = user.user_metadata || {};
        if (meta.name) setName(meta.name);
        if (meta.phone) setPhone(meta.phone);
        if (meta.dob) setDob(meta.dob);

        // Load doctor & conditions from AsyncStorage or metadata
        const savedDoctor = await AsyncStorage.getItem(STORAGE_DOCTOR);
        const savedConditions = await AsyncStorage.getItem(STORAGE_CONDITIONS);

        setDoctor(savedDoctor ?? meta.doctor ?? '');
        setConditions(savedConditions ?? meta.conditions ?? '');
      }
    } catch (err) {
      console.log('Error loading user profile data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      const trimmedDoctor = doctor.trim();
      const trimmedConditions = conditions.trim();

      // 1. Save to AsyncStorage so Profile & Reports immediately reflect updates
      await AsyncStorage.setItem(STORAGE_DOCTOR, trimmedDoctor || 'Not set');
      await AsyncStorage.setItem(STORAGE_CONDITIONS, trimmedConditions || 'Not set');

      // 2. Save to Supabase user metadata
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        dob: dob.trim(),
        doctor: trimmedDoctor,
        conditions: trimmedConditions,
      });

      Alert.alert('Success', 'Your profile and health details have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.log('Error updating profile:', err);
      // Still allow saving locally even if remote metadata fails
      Alert.alert('Saved Locally', 'Details updated on this device.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const initial = (name.trim() ? name.trim().charAt(0) : 'U').toUpperCase();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.canvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            Edit Profile
          </Text>
        </View>

        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.sage.base} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.sage.base }]}>
                  <Text style={[styles.avatarInitial, { fontSize: scaled(32) }]}>{initial}</Text>
                </View>
              </View>
            </View>

            {/* SECTION: HEALTH INFORMATION */}
            <View style={[styles.sectionCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              <Text style={[styles.sectionHeader, { color: colors.sage.dark, fontSize: scaled(12) }]}>
                HEALTH &amp; CLINICAL DETAILS
              </Text>

              <View style={styles.fieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.fieldLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                    PRIMARY CARE DOCTOR / CLINIC
                  </Text>
                  <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(10), color: colors.sage.dark }}>
                    OPTIONAL
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                      borderColor: colors.neutral.border,
                      color: colors.neutral.brown,
                      fontSize: scaled(14),
                    },
                  ]}
                  value={doctor}
                  onChangeText={setDoctor}
                  placeholder="e.g. Dr. Priya Anand (or leave blank if you switch doctors)"
                  placeholderTextColor={colors.neutral.muted}
                  autoCapitalize="words"
                />
                <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(10.5), color: colors.neutral.muted, marginTop: 4 }}>
                  Optional. Leave empty if you change doctors or visit clinics as needed.
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                  TRACKED CONDITIONS &amp; DIAGNOSES
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                      borderColor: colors.neutral.border,
                      color: colors.neutral.brown,
                      fontSize: scaled(14),
                    },
                  ]}
                  value={conditions}
                  onChangeText={setConditions}
                  placeholder="e.g. Chronic Migraine, IBS, Asthma"
                  placeholderTextColor={colors.neutral.muted}
                />
              </View>
            </View>

            {/* SECTION: PERSONAL */}
            <View style={[styles.sectionCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              <Text style={[styles.sectionHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                PERSONAL DETAILS
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                  FULL NAME
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                      borderColor: colors.neutral.border,
                      color: colors.neutral.brown,
                      fontSize: scaled(14),
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor={colors.neutral.muted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                  EMAIL (ACCOUNT)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.disabledInput,
                    {
                      backgroundColor: isDarkMode ? '#24201D' : '#F3ECE1',
                      borderColor: colors.neutral.border,
                      color: colors.neutral.muted,
                      fontSize: scaled(14),
                    },
                  ]}
                  value={email}
                  editable={false}
                  placeholder="user@example.com"
                  placeholderTextColor={colors.neutral.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                  PHONE NUMBER
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                      borderColor: colors.neutral.border,
                      color: colors.neutral.brown,
                      fontSize: scaled(14),
                    },
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 012-3456"
                  placeholderTextColor={colors.neutral.muted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                  DATE OF BIRTH
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                      borderColor: colors.neutral.border,
                      color: colors.neutral.brown,
                      fontSize: scaled(14),
                    },
                  ]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.neutral.muted}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.sage.dark },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.saveButtonText, { fontSize: scaled(16) }]}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: 'DMSerifDisplay-Regular',
    color: '#FFFFFF',
  },
  sectionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  fieldGroup: {
    marginBottom: Spacing.sm + 2,
  },
  fieldLabel: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: 'Nunito-Medium',
  },
  disabledInput: {
    opacity: 0.65,
  },
  saveButton: {
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    elevation: 3,
  },
  saveButtonText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
