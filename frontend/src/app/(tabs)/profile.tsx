import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { getCurrentUser, signOut } from '@/lib/auth';

export default function ProfileScreen() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [dailyReminders, setDailyReminders] = useState(true);
    const [aiSharing, setAiSharing] = useState(true);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.log('Error loading profile:', error);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out of SymptomJournal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/onboarding/slide-1');
                    },
                },
            ]
        );
    };

    const userName = user?.user_metadata?.name || 'SymptomJournal User';
    const userEmail = user?.email || 'user@example.com';
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '2026';

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>User Profile</Text>
                    <Text style={styles.subtitle}>Manage your health info, preferences & account settings</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* User Card */}
                    <View style={styles.userCard}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{userName}</Text>
                            <Text style={styles.userEmail}>{userEmail}</Text>
                            <Text style={styles.memberTag}>Member since {memberSince}</Text>
                        </View>
                    </View>

                    {/* Health Profile Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>🩺 Health Profile</Text>
                        
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Primary Conditions</Text>
                            <Text style={styles.infoVal}>Migraine, Tension Headaches</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Known Allergies</Text>
                            <Text style={styles.infoVal}>Penicillin, Dust Mites</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Emergency Contact</Text>
                            <Text style={styles.infoVal}>+27 (0)82 123 4567</Text>
                        </View>
                    </View>

                    {/* App Preferences Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>⚙️ Preferences & Privacy</Text>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchLabel}>Daily Symptom Reminder</Text>
                                <Text style={styles.switchSub}>Receive daily evening logging prompts</Text>
                            </View>
                            <Switch
                                value={dailyReminders}
                                onValueChange={setDailyReminders}
                                trackColor={{ false: Colors.neutral.border, true: Colors.sage.base }}
                            />
                        </View>

                        <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchLabel}>AI Insights Processing</Text>
                                <Text style={styles.switchSub}>Allow Gemini AI pattern correlation</Text>
                            </View>
                            <Switch
                                value={aiSharing}
                                onValueChange={setAiSharing}
                                trackColor={{ false: Colors.neutral.border, true: Colors.sage.base }}
                            />
                        </View>
                    </View>

                    {/* Sign Out Action */}
                    <TouchableOpacity
                        style={styles.signOutBtn}
                        onPress={handleSignOut}
                        activeOpacity={0.8}>
                        <Text style={styles.signOutBtnText}>Sign Out of Account</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background.canvas },
    safe: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral.border,
    },
    title: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
    },
    subtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        marginTop: 2,
    },

    scrollContent: { padding: Spacing.lg },

    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: Radius.full,
        backgroundColor: Colors.sage.base,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: 26,
        color: Colors.white,
    },
    userInfo: { flex: 1 },
    userName: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.h2,
        color: Colors.neutral.brown,
    },
    userEmail: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        marginTop: 2,
    },
    memberTag: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.sage.dark,
        marginTop: 4,
    },

    card: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    cardTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.neutral.brown,
        marginBottom: Spacing.md,
    },

    infoRow: {
        marginBottom: Spacing.sm,
        paddingBottom: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral.border,
    },
    infoLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: Colors.neutral.muted,
        textTransform: 'uppercase',
    },
    infoVal: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        marginTop: 2,
    },

    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral.border,
    },
    switchLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    switchSub: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: Colors.neutral.muted,
        marginTop: 2,
    },

    signOutBtn: {
        backgroundColor: Colors.terracotta.base,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    signOutBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.white,
    },
});