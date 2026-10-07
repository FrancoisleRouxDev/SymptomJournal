import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { getCurrentUser, signOut } from '@/lib/auth';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';


const ACHIEVEMENTS = [
    { title: '7-Day Streak', icon: '🔥', earned: true },
    { title: '50 Entries', icon: '📝', earned: true },
    { title: 'Pattern Spotter', icon: '🎯', earned: true },
    { title: '30-Day Streak', icon: '🌿', earned: false },
    { title: '100 Entries', icon: '🏆', earned: false },
    { title: 'AI Explorer', icon: '💡', earned: false },
];

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    const loadUserProfile = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.log('Error loading profile:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
        }, [])
    );

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
                        router.replace('/auth/sign-in' as any);
                    },
                },
            ]
        );
    };

    const userName = user?.user_metadata?.name || 'Sarah Mitchell';
    const userEmail = user?.email || 'sarah@example.com';
    const doctorName = user?.user_metadata?.doctor || 'Dr. Priya Anand';
    const conditions = user?.user_metadata?.conditions || 'Chronic Migraine, IBS';
    const initial = userName.charAt(0).toUpperCase();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Profile</Text>
                        <TouchableOpacity
                            style={styles.gearBtn}
                            onPress={() => router.push('/settings' as any)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.gearText}>⚙️</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sage Green Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <Text style={styles.nameText}>{userName}</Text>
                        <Text style={styles.emailText}>{userEmail}</Text>
                        <Text style={styles.memberSub}>Member since Jan 2026</Text>

                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => router.push('/profile/edit' as any)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.editBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 3 Stat Boxes Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>32</Text>
                            <Text style={styles.statLabel}>Entries</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>18</Text>
                            <Text style={styles.statLabel}>Days Active</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>6</Text>
                            <Text style={styles.statLabel}>Symptom Types</Text>
                        </View>
                    </View>

                    {/* Achievements Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Achievements</Text>
                            <Text style={styles.earnedText}>3 / 6 earned</Text>
                        </View>

                        <View style={styles.achievementsGrid}>
                            {ACHIEVEMENTS.map((item) => (
                                <View key={item.title} style={[styles.achievementTile, !item.earned && styles.achievementTileLocked]}>
                                    <View style={[styles.badgeIconBox, !item.earned && styles.badgeIconBoxLocked]}>
                                        <Text style={[styles.badgeIconText, !item.earned && { opacity: 0.4 }]}>{item.icon}</Text>
                                    </View>
                                    <Text style={[styles.achievementTitle, !item.earned && styles.achievementTitleLocked]}>
                                        {item.title}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Health Overview Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Health Overview</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Primary Doctor</Text>
                            <Text style={styles.infoVal}>{doctorName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tracked Conditions</Text>
                            <Text style={styles.infoVal}>{conditions}</Text>
                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
                        <Text style={styles.signOutBtnText}>Sign Out of Account</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F0E8' },
    safe: { flex: 1 },
    scrollContent: { padding: Spacing.lg },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
    },
    gearBtn: {
        width: 38,
        height: 38,
        borderRadius: Radius.full,
        backgroundColor: Colors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    gearText: { fontSize: 18 },

    profileCard: {
        backgroundColor: '#5C7C67',
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 2,
        borderColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarText: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: 28,
        color: Colors.white,
    },
    nameText: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.h1,
        color: Colors.white,
    },
    emailText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
    },
    memberSub: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
        marginBottom: Spacing.md,
    },
    editBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: Radius.full,
    },
    editBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.white,
    },

    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: Spacing.lg,
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.background.card,
        borderRadius: Radius.xl,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    statNum: {
        fontFamily: 'Nunito-Bold',
        fontSize: 24,
        color: Colors.neutral.brown,
    },
    statLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: Colors.neutral.muted,
        marginTop: 2,
    },

    card: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    cardTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.neutral.brown,
    },
    earnedText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },

    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    achievementTile: {
        width: '30%',
        alignItems: 'center',
    },
    achievementTileLocked: {
        opacity: 0.5,
    },
    badgeIconBox: {
        width: 52,
        height: 52,
        borderRadius: Radius.lg,
        backgroundColor: Colors.background.canvas,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    badgeIconBoxLocked: {
        backgroundColor: '#EFE8DE',
    },
    badgeIconText: {
        fontSize: 24,
    },
    achievementTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.neutral.brown,
        textAlign: 'center',
    },
    achievementTitleLocked: {
        color: Colors.neutral.muted,
    },

    infoRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral.border,
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

    signOutBtn: {
        backgroundColor: Colors.terracotta.base,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: Spacing.xs,
        marginBottom: Spacing.xl,
    },
    signOutBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.white,
    },
});