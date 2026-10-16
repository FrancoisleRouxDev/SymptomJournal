import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Spacing, Radius } from '@/constants/theme';
import { getCurrentUser, signOut } from '@/lib/auth';
import {
    Settings,
    Flame,
    ClipboardList,
    Target,
    Leaf,
    Trophy,
    Sparkles,
    Pencil,
    Check,
    X,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_DOCTOR = '@symptomjournal_doctor';
const STORAGE_CONDITIONS = '@symptomjournal_conditions';

const DEFAULT_ACHIEVEMENTS = [
    { id: 'streak_7', title: '7-Day Streak', icon: Flame, minDays: 7 },
    { id: 'entries_50', title: '50 Entries', icon: ClipboardList, minEntries: 50 },
    { id: 'pattern_spotter', title: 'Pattern Spotter', icon: Target, minEntries: 3 },
    { id: 'streak_30', title: '30-Day Streak', icon: Leaf, minDays: 30 },
    { id: 'entries_100', title: '100 Entries', icon: Trophy, minEntries: 100 },
    { id: 'ai_explorer', title: 'AI Explorer', icon: Sparkles, minEntries: 3 },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { colors, scaled } = useTheme();

    const [user, setUser] = useState<any>(null);
    const [entriesCount, setEntriesCount] = useState(0);
    const [daysActive, setDaysActive] = useState(0);
    const [symptomTypesCount, setSymptomTypesCount] = useState(0);

    // Editable health info
    const [doctorName, setDoctorName] = useState('Not set');
    const [conditions, setConditions] = useState('Not set');
    const [editingDoctor, setEditingDoctor] = useState(false);
    const [editingConditions, setEditingConditions] = useState(false);
    const [draftDoctor, setDraftDoctor] = useState('');
    const [draftConditions, setDraftConditions] = useState('');
    const [saving, setSaving] = useState(false);

    const loadUserProfileAndStats = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            const savedDoctor = await AsyncStorage.getItem(STORAGE_DOCTOR);
            const savedConditions = await AsyncStorage.getItem(STORAGE_CONDITIONS);
            setDoctorName(savedDoctor ?? 'Not set');
            setConditions(savedConditions ?? 'Not set');

            const res = await api.get('/symptoms/history');
            const logs: any[] = res.data?.symptoms || [];
            setEntriesCount(logs.length);

            const uniqueDays = new Set<string>();
            const uniqueTypes = new Set<string>();
            logs.forEach((log) => {
                if (log.created_at) uniqueDays.add(log.created_at.slice(0, 10));
                const desc = (log.description || 'General').replace(/\s*\(.*?\)/, '').trim();
                if (desc) uniqueTypes.add(desc);
            });
            setDaysActive(uniqueDays.size || (logs.length > 0 ? 1 : 0));
            setSymptomTypesCount(uniqueTypes.size);
        } catch (error) {
            console.log('Error loading profile & stats:', error);
        }
    };

    useFocusEffect(useCallback(() => { loadUserProfileAndStats(); }, []));

    const saveDoctor = async () => {
        setSaving(true);
        try {
            const val = draftDoctor.trim() || 'Not set';
            await AsyncStorage.setItem(STORAGE_DOCTOR, val);
            setDoctorName(val);
            setEditingDoctor(false);
        } catch { Alert.alert('Error', 'Could not save.'); }
        finally { setSaving(false); }
    };

    const saveConditions = async () => {
        setSaving(true);
        try {
            const val = draftConditions.trim() || 'Not set';
            await AsyncStorage.setItem(STORAGE_CONDITIONS, val);
            setConditions(val);
            setEditingConditions(false);
        } catch { Alert.alert('Error', 'Could not save.'); }
        finally { setSaving(false); }
    };

    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/auth/sign-in' as any); } },
        ]);
    };

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const userEmail = user?.email || '';
    const initial = userName.charAt(0).toUpperCase();

    const achievementsWithStatus = DEFAULT_ACHIEVEMENTS.map((item) => {
        let earned = false;
        if (item.minDays && daysActive >= item.minDays) earned = true;
        else if (item.minEntries && entriesCount >= item.minEntries) earned = true;
        return { ...item, earned };
    });
    const earnedCount = achievementsWithStatus.filter((a) => a.earned).length;

    const cardStyle = [styles.card, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }];

    return (
        <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: scaled(26), color: colors.neutral.brown }}>Profile</Text>
                        <TouchableOpacity
                            style={[styles.gearBtn, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}
                            onPress={() => router.push('/settings' as any)}
                            activeOpacity={0.7}
                        >
                            <Settings size={18} color={colors.neutral.brown} />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Hero Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarCircle}>
                            <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: scaled(28), color: '#FFF' }}>{initial}</Text>
                        </View>
                        <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: scaled(22), color: '#FFF' }}>{userName}</Text>
                        <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(12), color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{userEmail}</Text>
                        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile/edit' as any)} activeOpacity={0.8}>
                            <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(12), color: '#FFF' }}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        {[
                            { label: 'Entries', value: entriesCount },
                            { label: 'Days Active', value: daysActive },
                            { label: 'Symptom Types', value: symptomTypesCount },
                        ].map((stat) => (
                            <View key={stat.label} style={[styles.statBox, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
                                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(24), color: colors.neutral.brown }}>{stat.value}</Text>
                                <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(10), color: colors.neutral.muted, marginTop: 2 }}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Achievements */}
                    <View style={cardStyle}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown }}>Achievements</Text>
                            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(12), color: colors.sage.dark }}>{earnedCount} / {DEFAULT_ACHIEVEMENTS.length} earned</Text>
                        </View>
                        <View style={styles.achievementsGrid}>
                            {achievementsWithStatus.map((item) => {
                                const IconComp = item.icon;
                                return (
                                    <View key={item.id} style={[styles.achievementTile, !item.earned && { opacity: 0.45 }]}>
                                        <View style={[styles.badgeIconBox, { backgroundColor: item.earned ? colors.sage.tint : colors.background.cream }]}>
                                            <IconComp size={18} color={item.earned ? colors.sage.dark : colors.neutral.muted} />
                                        </View>
                                        <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(10), color: item.earned ? colors.neutral.brown : colors.neutral.muted, textAlign: 'center' }}>
                                            {item.title}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Health Overview — Editable */}
                    <View style={cardStyle}>
                        <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown, marginBottom: Spacing.sm }}>Health Overview</Text>

                        {/* Doctor */}
                        <View style={[styles.infoRow, { borderTopColor: colors.neutral.border }]}>
                            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(10), color: colors.neutral.muted, textTransform: 'uppercase' }}>Primary Doctor</Text>
                            {editingDoctor ? (
                                <View style={styles.editRow}>
                                    <TextInput
                                        style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown, borderBottomWidth: 1.5, borderBottomColor: colors.sage.base, paddingVertical: 4, flex: 1 }}
                                        value={draftDoctor}
                                        onChangeText={setDraftDoctor}
                                        placeholder="e.g. Dr. Smith"
                                        placeholderTextColor={colors.neutral.muted}
                                        autoFocus
                                    />
                                    <TouchableOpacity onPress={saveDoctor} style={styles.editActionBtn} disabled={saving}>
                                        {saving ? <ActivityIndicator size={14} color={colors.sage.base} /> : <Check size={16} color={colors.sage.base} />}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingDoctor(false)} style={styles.editActionBtn}>
                                        <X size={16} color={colors.neutral.muted} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.editRow}>
                                    <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown, flex: 1, marginTop: 2 }}>{doctorName}</Text>
                                    <TouchableOpacity onPress={() => { setDraftDoctor(doctorName === 'Not set' ? '' : doctorName); setEditingDoctor(true); }} style={styles.editActionBtn}>
                                        <Pencil size={14} color={colors.neutral.muted} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Conditions */}
                        <View style={[styles.infoRow, { borderTopColor: colors.neutral.border }]}>
                            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: scaled(10), color: colors.neutral.muted, textTransform: 'uppercase' }}>Tracked Conditions</Text>
                            {editingConditions ? (
                                <View style={styles.editRow}>
                                    <TextInput
                                        style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown, borderBottomWidth: 1.5, borderBottomColor: colors.sage.base, paddingVertical: 4, flex: 1 }}
                                        value={draftConditions}
                                        onChangeText={setDraftConditions}
                                        placeholder="e.g. Migraine, IBS"
                                        placeholderTextColor={colors.neutral.muted}
                                        autoFocus
                                    />
                                    <TouchableOpacity onPress={saveConditions} style={styles.editActionBtn} disabled={saving}>
                                        {saving ? <ActivityIndicator size={14} color={colors.sage.base} /> : <Check size={16} color={colors.sage.base} />}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingConditions(false)} style={styles.editActionBtn}>
                                        <X size={16} color={colors.neutral.muted} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.editRow}>
                                    <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(14), color: colors.neutral.brown, flex: 1, marginTop: 2 }}>{conditions}</Text>
                                    <TouchableOpacity onPress={() => { setDraftConditions(conditions === 'Not set' ? '' : conditions); setEditingConditions(true); }} style={styles.editActionBtn}>
                                        <Pencil size={14} color={colors.neutral.muted} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Sign Out */}
                    <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
                        <Text style={{ fontFamily: 'Nunito-Bold', fontSize: scaled(16), color: '#FFF' }}>Sign Out of Account</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },
    scrollContent: { padding: Spacing.lg },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    gearBtn: { width: 38, height: 38, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    profileCard: { backgroundColor: '#5C7C67', borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg },
    avatarCircle: { width: 64, height: 64, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    editBtn: { marginTop: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.full },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
    statBox: { flex: 1, borderRadius: Radius.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
    card: { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    achievementTile: { width: '30%', alignItems: 'center' },
    badgeIconBox: { width: 52, height: 52, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    infoRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
    editRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    editActionBtn: { padding: 4 },
    signOutBtn: { backgroundColor: '#C4714F', borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl },
});
