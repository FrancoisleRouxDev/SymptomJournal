import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import {
    Home,
    Plus,
    List,
    Brain,
    FileText,
    Pill,
    User
} from 'lucide-react-native';

export default function TabsLayout() {
    return (
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
                name="medication"
                options={{
                    title: 'Rx Assistant',
                    tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}