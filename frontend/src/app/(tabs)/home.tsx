import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';

export default function HomeScreen() {
    const router = useRouter();

    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('S');
    const [recentSymptoms, setRecentSymptoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Stats
    const [wellnessScore, setWellnessScore] = useState(82);
    const [dayStreak, setDayStreak] = useState(3);
    const [loggedTodayCount, setLoggedTodayCount] = useState(0);
    const [thisMonthCount, setThisMonthCount] = useState(0);
    const [hasInsight, setHasInsight] = useState(false);
    const [insightText, setInsightText] = useState('Headaches correlate with poor sleep — tap to view');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            const name = user?.user_metadata?.name || 'Sarah';
            const firstName = name.split(' ')[0];
            setUserName(firstName);
            setUserInitial(firstName.charAt(0).toUpperCase());

            const response = await api.get('/symptoms/history');
            const symptoms = response.data.symptoms || [];
            setRecentSymptoms(symptoms.slice(0, 4));

            // Calculate Stats
            const todayStr = new Date().toISOString().split('T')[0];
            const todayLogs = symptoms.filter((s: any) => s.created_at?.startsWith(todayStr));
            setLoggedTodayCount(todayLogs.length);

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const monthLogs = symptoms.filter((s: any) => {
                const d = new Date(s.created_at);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            setThisMonthCount(monthLogs.length);

            // Compute Wellness score (100 - average severity * 8)
            if (symptoms.length > 0) {
                const avgSev = symptoms.reduce((acc: number, s: any) => acc + (s.severity || 5), 0) / symptoms.length;
                const score = Math.max(40, Math.round(100 - avgSev * 7));
                setWellnessScore(score);
            }

            setHasInsight(symptoms.length >= 3);
        } catch (error) {
            console.log('Error loading home data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getFormattedDate = () => {
        const today = new Date();
        return today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getSeverityDotColor = (sev: number) => {
        if (sev <= 3) return Colors.sage.base;
        if (sev <= 6) return '#D97706'; // Amber
        return Colors.terracotta.base; // Terracotta/Red
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.sage.dark]} />}>

                    {/* Top Header Bar */}
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.dateLabel}>{getFormattedDate()}</Text>
                            <Text style={styles.greetingText}>{getGreeting()}, {userName}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.avatarCircle}
                            onPress={() => router.push('/(tabs)/profile' as any)}>
                            <Text style={styles.avatarText}>{userInitial}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* TODAY'S WELLNESS Card */}
                    <View style={styles.wellnessCard}>
                        <Text style={styles.wellnessLabel}>TODAY'S WELLNESS</Text>
                        <View style={styles.scoreRow}>
                            <Text style={styles.scoreNumber}>{wellnessScore}</Text>
                            <Text style={styles.scoreMax}> /100</Text>
                        </View>
                        <Text style={styles.deltaText}>▲ 8 pts from yesterday</Text>

                        {/* 3 Sub-Cards Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statSubCard}>
                                <Text style={styles.statSubNum}>{dayStreak}</Text>
                                <Text style={styles.statSubLabel}>Day Streak</Text>
                            </View>
                            <View style={styles.statSubCard}>
                                <Text style={styles.statSubNum}>{loggedTodayCount}</Text>
                                <Text style={styles.statSubLabel}>Logged Today</Text>
                            </View>
                            <View style={styles.statSubCard}>
                                <Text style={styles.statSubNum}>{thisMonthCount}</Text>
                                <Text style={styles.statSubLabel}>This Month</Text>
                            </View>
                        </View>
                    </View>

                    {/* + Log a Symptom Button */}
                    <TouchableOpacity
                        style={styles.logBtn}
                        onPress={() => router.push('/(tabs)/log' as any)}
                        activeOpacity={0.85}>
                        <Text style={styles.logBtnText}>+ Log a Symptom</Text>
                    </TouchableOpacity>

                    {/* Recent Symptoms Header */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Recent Symptoms</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/timeline' as any)}>
                            <Text style={styles.seeAllText}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Symptoms List */}
                    {loading ? (
                        <ActivityIndicator color={Colors.terracotta.base} style={{ marginVertical: 20 }} />
                    ) : recentSymptoms.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>No symptoms logged yet</Text>
                            <Text style={styles.emptySub}>Tap "+ Log a Symptom" above to start tracking.</Text>
                        </View>
                    ) : (
                        recentSymptoms.map((symptom) => {
                            const timeFormatted = new Date(symptom.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <View key={symptom.id} style={styles.symptomCard}>
                                    <View style={[styles.dotCircle, { backgroundColor: getSeverityDotColor(symptom.severity) }]} />
                                    <View style={styles.symptomDetails}>
                                        <Text style={styles.symptomTitle}>{symptom.description}</Text>
                                        <Text style={styles.symptomSub}>
                                            {symptom.time_of_day || 'Today'} • {timeFormatted}
                                        </Text>
                                    </View>
                                    <View style={styles.severityCol}>
                                        <Text style={[styles.severityNum, { color: getSeverityDotColor(symptom.severity) }]}>
                                            {symptom.severity}
                                        </Text>
                                        <Text style={styles.severityDenom}>/10</Text>
                                    </View>
                                </View>
                            );
                        })
                    )}

                    {/* New AI Insight Banner */}
                    {hasInsight && (
                        <TouchableOpacity
                            style={styles.insightBannerCard}
                            onPress={() => router.push('/(tabs)/insights' as any)}
                            activeOpacity={0.85}>
                            <View style={styles.insightIconBox}>
                                <Text style={styles.insightIconText}>?</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.insightBannerTitle}>New AI insight ready</Text>
                                <Text style={styles.insightBannerSub}>{insightText}</Text>
                            </View>
                            <Text style={styles.insightChevron}>›</Text>
                        </TouchableOpacity>
                    )}

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
    dateLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
    greetingText: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
        marginTop: 2,
    },
    avatarCircle: {
        width: 46,
        height: 46,
        borderRadius: Radius.full,
        backgroundColor: Colors.sage.base,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: 20,
        color: Colors.white,
    },

    wellnessCard: {
        backgroundColor: '#5C7C67',
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    wellnessLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.label,
        color: 'rgba(255, 255, 255, 0.75)',
        letterSpacing: 1,
        marginBottom: 4,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreNumber: {
        fontFamily: 'Nunito-Bold',
        fontSize: 44,
        color: Colors.white,
    },
    scoreMax: {
        fontFamily: 'Nunito-Bold',
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.75)',
    },
    deltaText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
        marginBottom: Spacing.md,
    },

    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statSubCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderRadius: Radius.md,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    statSubNum: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.h2,
        color: Colors.white,
    },
    statSubLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
    },

    logBtn: {
        backgroundColor: Colors.terracotta.base,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    logBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.white,
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.neutral.brown,
    },
    seeAllText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.sage.dark,
    },

    emptyCard: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        marginBottom: 4,
    },
    emptySub: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },

    symptomCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    dotCircle: {
        width: 14,
        height: 14,
        borderRadius: Radius.full,
        marginRight: Spacing.md,
    },
    symptomDetails: { flex: 1 },
    symptomTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    symptomSub: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        marginTop: 2,
    },
    severityCol: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    severityNum: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.h2,
    },
    severityDenom: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },

    insightBannerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    insightIconBox: {
        width: 38,
        height: 38,
        borderRadius: Radius.md,
        backgroundColor: Colors.sage.tint,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    insightIconText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 18,
        color: Colors.sage.dark,
    },
    insightBannerTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    insightBannerSub: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        marginTop: 2,
    },
    insightChevron: {
        fontFamily: 'Nunito-Bold',
        fontSize: 22,
        color: Colors.neutral.muted,
        marginLeft: 8,
    },
});