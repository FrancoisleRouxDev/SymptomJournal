import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { User, Mail, Lock } from 'lucide-react-native';
import { signUp } from '@/lib/auth';
import { Alert } from 'react-native';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    try {
      await signUp(name, email, password);
      router.replace('/(tabs)/home' as any);
    } catch (error: any) {
      Alert.alert('Sign up failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.step}>Step 1 of 2 — Account details</Text>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>

          {/* Form */}
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
                  placeholder="your@email.com"
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
                  placeholder="Min. 8 characters"
                  placeholderTextColor={Colors.neutral.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          {/* Sign in link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  backText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.body,
    color: Colors.neutral.brownMid,
  },
  heading: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: FontSize.h1,
    color: Colors.neutral.brown,
    marginBottom: Spacing.xs,
  },
  step: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.caption,
    color: Colors.neutral.muted,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.sage.tint,
    borderRadius: Radius.full,
    marginBottom: Spacing.xl,
  },
  progressFill: {
    width: '50%',
    height: 4,
    backgroundColor: Colors.sage.base,
    borderRadius: Radius.full,
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
    fontSize: FontSize.label,
    color: Colors.neutral.muted,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  inputIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.body,
    color: Colors.neutral.brown,
  },
  terms: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.caption,
    color: Colors.neutral.muted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.sage.dark,
    fontFamily: 'Nunito-Bold',
  },
  button: {
    backgroundColor: Colors.sage.base,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buttonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.button,
    color: Colors.background.card,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.caption,
    color: Colors.neutral.muted,
  },
  signInLink: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.caption,
    color: Colors.sage.dark,
  },
});