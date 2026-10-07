import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { User, Mail, Lock, ChevronLeft, Calendar, Check } from 'lucide-react-native';
import { signUp, updateUserProfile } from '@/lib/auth';
import { Alert } from 'react-native';

const SEX_OPTIONS = ['Female', 'Male', 'Prefer not to say'];

const GOAL_OPTIONS = [
  'Track symptoms',
  'Find patterns',
  'Doctor visits',
  'Chronic condition',
  'General wellness',
];

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 Fields
  const [dob, setDob] = useState('1994-05-12');
  const [sex, setSex] = useState('Female');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Track symptoms',
    'Find patterns',
  ]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleStep1Next = () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all account details.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setStep(2);
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      try {
        await updateUserProfile({
          name: name.trim(),
          dob: dob.trim(),
        });
      } catch (e) {
        // Continue even if secondary metadata update fails
      }
      router.replace('/(tabs)/home' as any);
    } catch (error: any) {
      Alert.alert('Sign up failed', error.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Top Row with Back Button */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step === 2) {
                  setStep(1);
                } else {
                  router.back();
                }
              }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color={Colors.neutral.brown} />
            </TouchableOpacity>
            <View style={styles.headerTextGroup}>
              <Text style={styles.heading}>Create account</Text>
              <Text style={styles.step}>
                {step === 1 ? 'Step 1 of 2 — Account details' : 'Step 2 of 2 — About you'}
              </Text>
            </View>
          </View>

          {/* Segmented Progress bar */}
          <View style={styles.progressRow}>
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View
              style={[
                styles.progressSegment,
                step === 2 && styles.progressSegmentActive,
              ]}
            />
          </View>

          {step === 1 ? (
            /* STEP 1: ACCOUNT DETAILS */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color={Colors.neutral.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Sarah Mitchell"
                    placeholderTextColor={Colors.neutral.muted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color={Colors.neutral.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="sarah@example.com"
                    placeholderTextColor={Colors.neutral.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color={Colors.neutral.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={Colors.neutral.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Terms */}
              <Text style={styles.terms}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleStep1Next}
                activeOpacity={0.85}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* STEP 2: ABOUT YOU */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DATE OF BIRTH</Text>
                <View style={styles.inputWrapper}>
                  <Calendar size={16} color={Colors.neutral.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.neutral.muted}
                    value={dob}
                    onChangeText={setDob}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>BIOLOGICAL SEX</Text>
                <View style={styles.pillsRow}>
                  {SEX_OPTIONS.map((option) => {
                    const isSelected = sex === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.pill,
                          isSelected && styles.pillSelected,
                        ]}
                        onPress={() => setSex(option)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            isSelected && styles.pillTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>HEALTH GOALS</Text>
                <View style={styles.tagsContainer}>
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <TouchableOpacity
                        key={goal}
                        style={[
                          styles.tagPill,
                          isSelected && styles.tagPillSelected,
                        ]}
                        onPress={() => toggleGoal(goal)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.tagPillText,
                            isSelected && styles.tagPillTextSelected,
                          ]}
                        >
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.75 }, { marginTop: Spacing.md }]}
                onPress={handleCreateAccount}
                disabled={loading}
                activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Sign in link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-in' as any)}>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  headerTextGroup: {
    flex: 1,
  },
  heading: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 26,
    color: Colors.neutral.brown,
  },
  step: {
    fontFamily: 'Nunito-Medium',
    fontSize: 12,
    color: Colors.neutral.muted,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5DCCF',
    borderRadius: Radius.full,
  },
  progressSegmentActive: {
    backgroundColor: '#7B9E87',
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.neutral.muted,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E7DDD0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.body,
    color: Colors.neutral.brown,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.full,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: '#E7DDD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: '#7B9E87',
    borderColor: '#7B9E87',
  },
  pillText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12.5,
    color: Colors.neutral.brown,
  },
  pillTextSelected: {
    color: Colors.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: '#E7DDD0',
  },
  tagPillSelected: {
    backgroundColor: '#7B9E87',
    borderColor: '#7B9E87',
  },
  tagPillText: {
    fontFamily: 'Nunito-Medium',
    fontSize: 12.5,
    color: Colors.neutral.brown,
  },
  tagPillTextSelected: {
    fontFamily: 'Nunito-Bold',
    color: Colors.white,
  },
  terms: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.caption,
    color: Colors.neutral.muted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.sage.dark,
    fontFamily: 'Nunito-Bold',
  },
  button: {
    backgroundColor: '#7B9E87',
    borderRadius: Radius.lg,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C7C67',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.button,
    color: Colors.white,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  signInText: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.caption,
    color: Colors.neutral.muted,
  },
  signInLink: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.caption,
    color: Colors.terracotta.base,
  },
});