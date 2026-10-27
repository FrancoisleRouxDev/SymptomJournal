import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  DMSerifDisplay_400Regular,
} from '@expo-google-fonts/dm-serif-display';
import {
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { registerForPushNotificationsAsync, syncDailyReminderFromSettings } from '@/lib/notifications';
import { warmUpBackend } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isDarkMode, colors } = usePreferences();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background.canvas },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="terms" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'DMSerifDisplay-Regular': DMSerifDisplay_400Regular,
    'Nunito-Medium': Nunito_500Medium,
    'Nunito-Bold': Nunito_700Bold,
  });

  // Wake the free-tier backend on launch and whenever the app returns to the foreground
  useEffect(() => {
    warmUpBackend();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') warmUpBackend();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
      // Ask for permission, then make sure the daily reminder Settings shows is actually scheduled
      registerForPushNotificationsAsync()
        .then(() => syncDailyReminderFromSettings())
        .catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PreferencesProvider>
      <RootNavigator />
    </PreferencesProvider>
  );
}