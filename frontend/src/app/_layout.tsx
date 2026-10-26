import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  DMSerifDisplay_400Regular,
} from '@expo-google-fonts/dm-serif-display';
import {
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
      registerForPushNotificationsAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PreferencesProvider>
      <RootNavigator />
    </PreferencesProvider>
  );
}