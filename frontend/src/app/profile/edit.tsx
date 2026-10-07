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
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { getCurrentUser, updateUserProfile } from '@/lib/auth';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form State
  const [name, setName] = useState('Sarah Mitchell');
  const [email, setEmail] = useState('sarah@example.com');
  const [phone, setPhone] = useState('+1 (555) 012-3456');
  const [dob, setDob] = useState('1994-05-12');
  const [doctor, setDoctor] = useState('Dr. Priya Anand');
  const [conditions, setConditions] = useState('Chronic Migraine, IBS');

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
        if (meta.doctor) setDoctor(meta.doctor);
        if (meta.conditions) setConditions(meta.conditions);
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
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        dob: dob.trim(),
        doctor: doctor.trim(),
        conditions: conditions.trim(),
      });
      Alert.alert('Success', 'Your profile details have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Unable to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Profile Photo',
      'Select a photo or take a new picture for your profile avatar.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => Alert.alert('Camera', 'Avatar photo updated successfully!') },
        { text: 'Choose from Library', onPress: () => Alert.alert('Library', 'Avatar photo updated successfully!') },
      ]
    );
  };

  const initial = (name.trim() ? name.trim().charAt(0) : 'S').toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sage.base} />
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
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
                <TouchableOpacity
                  style={styles.pencilBadge}
                  onPress={handleChangePhoto}
                  activeOpacity={0.8}
                >
                  <Pencil size={13} color={Colors.white} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7}>
                <Text style={styles.changePhotoText}>Change photo</Text>
              </TouchableOpacity>
            </View>

            {/* SECTION: PERSONAL */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>PERSONAL</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Sarah Mitchell"
                  placeholderTextColor={Colors.neutral.muted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={email}
                  editable={false}
                  placeholder="sarah@example.com"
                  placeholderTextColor={Colors.neutral.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PHONE</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 012-3456"
                  placeholderTextColor={Colors.neutral.muted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
                <TextInput
                  style={styles.textInput}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.neutral.muted}
                />
              </View>
            </View>

            {/* SECTION: HEALTH INFORMATION */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>HEALTH INFORMATION</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PRIMARY DOCTOR</Text>
                <TextInput
                  style={styles.textInput}
                  value={doctor}
                  onChangeText={setDoctor}
                  placeholder="Dr. Priya Anand"
                  placeholderTextColor={Colors.neutral.muted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CONDITIONS</Text>
                <TextInput
                  style={styles.textInput}
                  value={conditions}
                  onChangeText={setConditions}
                  placeholder="Chronic Migraine, IBS"
                  placeholderTextColor={Colors.neutral.muted}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#7B9E87',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 32,
    color: Colors.white,
  },
  pencilBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C4714F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.canvas,
  },
  changePhotoText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: '#7B9E87',
  },
  sectionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    marginBottom: Spacing.md,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.neutral.muted,
    marginBottom: Spacing.sm,
  },
  fieldGroup: {
    marginBottom: Spacing.sm + 2,
  },
  fieldLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.neutral.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#FBF8F3',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E7DDD0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: 'Nunito-Medium',
    fontSize: 14,
    color: Colors.neutral.brown,
  },
  disabledInput: {
    opacity: 0.65,
    backgroundColor: '#F3ECE1',
  },
  saveButton: {
    backgroundColor: '#7B9E87',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: '#5C7C67',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.button,
    color: Colors.white,
  },
});
