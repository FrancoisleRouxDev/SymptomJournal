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
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

const WEEKLY_DATA = [
    { day: 'Mon', pain: 2, fatigue: 4 },
    { day: 'Tue', pain: 3, fatigue: 2 },
    { day: 'Wed', pain: 2, fatigue: 5 },
    { day: 'Thu', pain: 6, fatigue: 3 },
    { day: 'Fri', pain: 4, fatigue: 6 },
    { day: 'Sat', pain: 5, fatigue: 4 },
    { day: 'Sun', pain: 3, fatigue: 2 },
];

export default function AIInsightsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ready, setReady] = useState(true);
    const [mostFrequent, setMostFrequent] = useState('Headache');
    const [mostFrequentCount, setMostFrequentCount] = useState(9);
    const [avgSeverity, setAvgSeverity] = useState(5.2);

    useEffect(() => {
        fetchPatterns();
    }, []);

    const fetchPatterns = async () => {
        try {
            const response = await api.get('/analysis/patterns');
            const data = response.data;
            if (data.ready && data.analysis) {
                setMostFrequent(data.analysis.most_frequent_symptom || 'Headache');
                setAvgSeverity(data.analysis.average_severity || 5.2);
            }
        } catch (error) {
            console.log('Error fetching AI patterns:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPatterns();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.sage.dark]} />}>

                    {/* Header */}
                    <Text style={styles.dateRangeLabel}>SEP 13 – 19</Text>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>AI Insights</Text>
                        <View style={styles.updatedBadge}>
                            <Text style={styles.updatedBadgeText}>● Updated</Text>
                        </View>
                    </View>

                    {/* Weekly Overview Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Weekly Overview</Text>
                            <View style={styles.legendRow}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendSquare, { backgroundColor: Colors.terracotta.base }]} />
                                    <Text style={styles.legendText}>Pain</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendSquare, { backgroundColor: Colors.sage.light }]} />
                                    <Text style={styles.legendText}>Fatigue</Text>
                                </View>
                            </View>
                        </View>

                        {/* Bar Chart Visualization */}
                        <View style={styles.chartContainer}>
                            {WEEKLY_DATA.map((item) => (
                                <View key={item.day} style={styles.barGroup}>
                                    <View style={styles.barsPair}>
                                        <View style={[styles.bar, { height: item.pain * 6, backgroundColor: Colors.terracotta.base }]} />
                                        <View style={[styles.bar, { height: item.fatigue * 6, backgroundColor: Colors.sage.light }]} />
                                    </View>
                                    <Text style={styles.barDayText}>{item.day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>MOST FREQUENT</Text>
                            <Text style={[styles.statValue, { color: Colors.terracotta.base }]}>{mostFrequentCount}x</Text>
                            <Text style={styles.statSubText}>{mostFrequent}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>AVG SEVERITY</Text>
                            <Text style={[styles.statValue, { color: '#D97706' }]}>{avgSeverity}</Text>
                            <Text style={styles.statSubText}>This week</Text>
                        </View>
                    </View>

                    {/* KEY FINDINGS Header */}
                    <Text style={styles.sectionHeader}>KEY FINDINGS</Text>

                    {/* Finding Card 1 */}
                    <View style={styles.findingCard}>
                        <View style={styles.findingIconBox}>
                            <Text style={styles.findingIconText}>🌙</Text>
                        </View>
                        <View style={styles.findingContent}>
                            <Text style={styles.findingTitle}>Sleep Connection</Text>
                            <Text style={styles.findingBody}>
                                Headaches occur 82% more often after fewer than 6 hours of sleep. Try a consistent sleep schedule this week.
                            </Text>
                        </View>
                    </View>

                    {/* Finding Card 2 */}
                    <View style={styles.findingCard}>
                        <View style={styles.findingIconBox}>
                            <Text style={styles.findingIconText}>⏰</Text>
                        </View>
                        <View style={styles.findingContent}>
                            <Text style={styles.findingTitle}>Afternoon Peak</Text>
                            <Text style={styles.findingBody}>
                                Most pain symptoms appear between 1–4 PM. Consider a midday walk or short rest during this window.
                            </Text>
                        </View>
                    </View>

                    {/* Finding Card 3 */}
                    <View style={styles.findingCard}>
                        <View style={styles.findingIconBox}>
                            <Text style={styles.findingIconText}>📅</Text>
                        </View>
                        <View style={styles.findingContent}>
                            <Text style={styles.findingTitle}>Weekly Trend</Text>
                            <Text style={styles.findingBody}>
                                Fatigue symptoms have decreased 18% compared to last week. Your new sleep routine may be helping.
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F0E8' },
    safe: { flex: 1 },
    scrollContent: { padding: Spacing.lg },

    dateRangeLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.label,
        color: Colors.neutral.muted,
        letterSpacing: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        marginTop: 2,
    },
    title: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
    },
    updatedBadge: {
        backgroundColor: Colors.sage.tint,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.full,
    },
    updatedBadgeText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.sage.dark,
    },

    card: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.xl,
        padding: Spacing.md,
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
    legendRow: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendSquare: {
        width: 8,
        height: 8,
        borderRadius: 2,
    },
    legendText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },

    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 80,
        paddingTop: 10,
    },
    barGroup: {
        alignItems: 'center',
        gap: 6,
    },
    barsPair: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
    },
    bar: {
        width: 10,
        borderRadius: 3,
    },
    barDayText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: Colors.neutral.muted,
    },

    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.lg,
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.background.card,
        borderRadius: Radius.xl,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    statLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.neutral.muted,
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    statValue: {
        fontFamily: 'Nunito-Bold',
        fontSize: 32,
    },
    statSubText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.brownMid,
        marginTop: 2,
    },

    sectionHeader: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.label,
        color: Colors.neutral.muted,
        letterSpacing: 1,
        marginBottom: 12,
    },

    findingCard: {
        flexDirection: 'row',
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        alignItems: 'flex-start',
    },
    findingIconBox: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        backgroundColor: Colors.background.canvas,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    findingIconText: {
        fontSize: 22,
    },
    findingContent: {
        flex: 1,
    },
    findingTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        marginBottom: 4,
    },
    findingBody: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.brownMid,
        lineHeight: 18,
    },
});