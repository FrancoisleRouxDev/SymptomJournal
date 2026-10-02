import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
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

    // Hide floating button when already on medication screen
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
                        paddingBottom: 8,
                        paddingTop: 8,
                        height: 60,
                    },
                    tabBarActiveTintColor: Colors.sage.dark,
                    tabBarInactiveTintColor: Colors.neutral.muted,
                    tabBarLabelStyle: {
                        fontFamily: 'Nunito-Bold',
                        fontSize: 10,
                    },
                }}>
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="log"
                    options={{
                        title: 'Log',
                        tabBarIcon: ({ color, size }) => <Plus size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="timeline"
                    options={{
                        title: 'Timeline',
                        tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="insights"
                    options={{
                        title: 'Insights',
                        tabBarIcon: ({ color, size }) => <Brain size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="summary"
                    options={{
                        title: 'Summary',
                        tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                    }}
                />
                {/* Hidden from bottom tab bar, accessible via Floating AI Button */}
                <Tabs.Screen
                    name="medication"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>

            {/* Floating AI Assistant Action Button */}
            {!isMedicationScreen && (
                <TouchableOpacity
                    style={styles.floatingAiBtn}
                    onPress={() => router.push('/(tabs)/medication' as any)}
                    activeOpacity={0.85}>
                    <Sparkles size={18} color={Colors.white} />
                    <Text style={styles.floatingAiText}>AI Rx</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    floatingAiBtn: {
        position: 'absolute',
        bottom: 72,
        right: 16,
        backgroundColor: Colors.terracotta.base,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: Radius.full,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        zIndex: 9999,
    },
    floatingAiText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.white,
    },
});