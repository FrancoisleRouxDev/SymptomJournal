import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing } from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndRoute() {
      try {
        // 1. Check existing session persisted in AsyncStorage
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && !error) {
          // User is already logged in — refresh the session on open
          try {
            await supabase.auth.getUser();
          } catch {
            // Retain session if offline or slow network
          }
          if (isMounted) {
            router.replace('/(tabs)/home');
            return;
          }
        }

        // 2. If not logged in, check if user has previously completed onboarding
        const hasOnboarded = await AsyncStorage.getItem('has_onboarded');
        if (isMounted) {
          if (hasOnboarded === 'true') {
            router.replace('/auth/sign-in');
          } else {
            router.replace('/onboarding/slide-1');
          }
        }
      } catch (err) {
        console.error('Error checking auth state on app launch:', err);
        if (isMounted) {
          router.replace('/onboarding/slide-1');
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    checkAuthAndRoute();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color={Colors.sage.base} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logo: {
    width: 220,
    height: 220,
  },
  loader: {
    marginTop: Spacing.lg,
  },
});