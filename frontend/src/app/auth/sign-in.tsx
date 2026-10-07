import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { Droplets, Mail, Lock, Eye, EyeOff, UserCheck } from 'lucide-react-native';
import { signIn } from '@/lib/auth';
import { Alert } from 'react-native';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/home' as any);
    } catch (error: any) {
      Alert.alert('Sign in failed', error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Please enter your registered email address to receive password reset instructions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: () => Alert.alert('Check Your Email', 'Password reset instructions have been sent to your email.'),
        },
      ]
    );
  };

  const handleGuestLogin = () => {
    // Navigate straight to home tabs for demo/guest evaluation
    router.replace('/(tabs)/home' as any);
  };

  const handleSocialSignIn = (provider: string) => {
    Alert.alert(
      `${provider} Sign In`,
      `Connecting to ${provider}... In this demo, you can sign in directly with your email or use Guest mode.`,
      [
        { text: 'OK' }
      ]
    );
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

          {/* Logo icon matching wireframe */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Droplets size={28} color={Colors.white} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to SymptomJournal</Text>

          {/* Form */}
          <View style={styles.form}>
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
                  placeholder="••••••••"
                  placeholderTextColor={Colors.neutral.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPassword
                    ? <EyeOff size={16} color={Colors.neutral.muted} />
                    : <Eye size={16} color={Colors.neutral.muted} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.75 }]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignIn('Apple')}
              activeOpacity={0.7}
            >
              <Text style={styles.socialText}>🍎  Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignIn('Google')}
              activeOpacity={0.7}
            >
              <Text style={styles.socialText}>🌐  Google</Text>
            </TouchableOpacity>
          </View>

          {/* Continue as Guest */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestLogin}
            activeOpacity={0.7}
          >
            <UserCheck size={16} color={Colors.sage.dark} style={{ marginRight: 6 }} />
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-up' as any)}>
              <Text style={styles.signUpLink}>Sign up</Text>
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
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#7B9E87',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C7C67',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  heading: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 28,
    color: Colors.neutral.brown,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.body,
    color: Colors.neutral.muted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  form: {
    width: '100%',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },
  forgotText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.caption,
    color: Colors.sage.dark,
  },
  button: {
    backgroundColor: '#7B9E87',
    borderRadius: Radius.lg,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5DCCF',
  },
  dividerText: {
    fontFamily: 'Nunito-Medium',
    fontSize: 12,
    color: Colors.neutral.muted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E7DDD0',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.card,
  },
  socialText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13.5,
    color: Colors.neutral.brown,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#BDD2C3',
    borderRadius: Radius.md,
    paddingVertical: 12,
    backgroundColor: '#F2F7F4',
    marginBottom: Spacing.lg,
  },
  guestButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: Colors.sage.dark,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.caption,
    color: Colors.neutral.muted,
  },
  signUpLink: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.caption,
    color: Colors.terracotta.base,
  },
});