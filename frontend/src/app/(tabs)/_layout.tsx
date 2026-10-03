import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, FontSize } from '@/constants/theme';
import {
  Home,
  Plus,
  List,
  Brain,
  FileText,
  User,
  Sparkles,
} from 'lucide-react-native';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Ensure safe elevation above device navigation pill / gesture bar / Android HUD
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const tabHeight = 60 + bottomInset;

  // Hide floating button when already on the medication assistant screen
  const isMedicationScreen = pathname?.includes('medication');

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.background.card,
            borderTopColor: Colors.neutral.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: bottomInset,
            height: tabHeight,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          },
          tabBarActiveTintColor: Colors.sage.dark,
          tabBarInactiveTintColor: Colors.neutral.muted,
          tabBarLabelStyle: {
            fontFamily: 'Nunito-Bold',
            fontSize: 10,
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size - 1} color={color} />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            tabBarIcon: ({ color, size }) => <Plus size={size - 1} color={color} />,
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ color, size }) => <List size={size - 1} color={color} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color, size }) => <Brain size={size - 1} color={color} />,
          }}
        />
        <Tabs.Screen
          name="summary"
          options={{
            title: 'Summary',
            tabBarIcon: ({ color, size }) => <FileText size={size - 1} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size - 1} color={color} />,
          }}
        />
        {/* Hidden from bottom tabs, opened via Floating AI button */}
        <Tabs.Screen
          name="medication"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Floating AI Medication Assistant Button */}
      {!isMedicationScreen && (
        <TouchableOpacity
          style={[
            styles.floatingAiBtn,
            { bottom: tabHeight + 14 },
          ]}
          onPress={() => router.push('/(tabs)/medication' as any)}
          activeOpacity={0.85}
        >
          <Sparkles size={17} color={Colors.white} />
          <Text style={styles.floatingAiText}>AI Rx</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
  },
  floatingAiBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: Colors.terracotta.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    elevation: 6,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 9999,
  },
  floatingAiText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.caption,
    color: Colors.white,
  },
});