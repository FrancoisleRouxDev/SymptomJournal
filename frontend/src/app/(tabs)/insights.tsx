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
import api from '@/lib/api';

interface PatternAnalysis {
    most_frequent_symptom: string;
    average_severity: number;
    key_findings: string[];
    time_pattern: string;
    suggestion: string;
}

export default function AIInsightsScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ready, setReady] = useState(false);
    const [entriesCount, setEntriesCount] = useState(0);
    const [message, setMessage] = useState('');
    const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);

    useEffect(() => {
        fetchPatterns();
    }, []);

    const fetchPatterns = async () => {
        try {
            const response = await api.get('/analysis/patterns');
            const data = response.data;
            setReady(data.ready);
            if (data.ready) {
                setAnalysis(data.analysis);
                setEntriesCount(data.entries_analysed);
            } else {
                setMessage(data.message || 'Log at least 3 symptoms to unlock AI insights.');
                setEntriesCount(data.entries_count || 0);
            }
        } catch (error: any) {
            console.log('Error fetching AI patterns:', error);
            setMessage('Failed to load AI insights. Please check your connection.');
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
                
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>AI Pattern Insights</Text>
                    <Text style={styles.subtitle}>Gemini 1.5 Flash analysis of your symptom trends</Text>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.sage.dark} />
                        <Text style={styles.loadingText}>Analyzing symptom correlations...</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.sage.dark]} />}>

                        {!ready ? (
                            <View style={styles.lockCard}>
                                <Text style={styles.lockIcon}>🔒</Text>
                                <Text style={styles.lockTitle}>Insights Locked</Text>
                                <Text style={styles.lockMessage}>{message}</Text>

                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${Math.min((entriesCount / 3) * 100, 100)}%` }]} />
                                    </View>
                                    <Text style={styles.progressText}>{entriesCount} / 3 symptoms logged</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.logActionBtn}
                                    onPress={() => router.push('/(tabs)/log' as any)}>
                                    <Text style={styles.logActionBtnText}>+ Log a Symptom Now</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            analysis && (
                                <>
                                    {/* Stats Overview Grid */}
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>Most Frequent</Text>
                                            <Text style={styles.statValue}>{analysis.most_frequent_symptom}</Text>
                                        </View>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>Avg Severity</Text>
                                            <Text style={[styles.statValue, { color: Colors.terracotta.base }]}>
                                                {analysis.average_severity}/10
                                            </Text>
                                        </View>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>Logs Analyzed</Text>
                                            <Text style={styles.statValue}>{entriesCount}</Text>
                                        </View>
                                    </View>

                                    {/* Key Findings Card */}
                                    <View style={styles.card}>
                                        <Text style={styles.cardTitle}>🔍 Key Findings & Patterns</Text>
                                        {analysis.key_findings && analysis.key_findings.length > 0 ? (
                                            analysis.key_findings.map((finding, idx) => (
                                                <View key={idx} style={styles.findingItem}>
                                                    <Text style={styles.findingBullet}>•</Text>
                                                    <Text style={styles.findingText}>{finding}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.bodyText}>No distinct pattern anomalies found in recent logs.</Text>
                                        )}
                                    </View>

                                    {/* Time & Trigger Pattern */}
                                    {analysis.time_pattern && (
                                        <View style={styles.card}>
                                            <Text style={styles.cardTitle}>⏰ Time & Trigger Correlation</Text>
                                            <Text style={styles.bodyText}>{analysis.time_pattern}</Text>
                                        </View>
                                    )}

                                    {/* AI Doctor Suggestion Card */}
                                    {analysis.suggestion && (
                                        <View style={[styles.card, styles.suggestionCard]}>
                                            <Text style={styles.suggestionTitle}>💡 Clinical Recommendation</Text>
                                            <Text style={styles.suggestionText}>{analysis.suggestion}</Text>
                                        </View>
                                    )}

                                    {/* Generate Doctor Summary CTA */}
                                    <TouchableOpacity
                                        style={styles.summaryCtaBtn}
                                        onPress={() => router.push('/(tabs)/summary' as any)}>
                                        <Text style={styles.summaryCtaText}>Generate Exportable Doctor Summary →</Text>
                                    </TouchableOpacity>
                                </>
                            )
                        )}

                    </ScrollView>
                )}

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

    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.muted,
        marginTop: 12,
    },

    lockCard: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        marginTop: Spacing.lg,
    },
    lockIcon: { fontSize: 40, marginBottom: 8 },
    lockTitle: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.h2,
        color: Colors.neutral.brown,
        marginBottom: 8,
    },
    lockMessage: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.muted,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },

    progressContainer: { width: '100%', alignItems: 'center', marginBottom: Spacing.lg },
    progressBarBg: {
        width: '100%',
        height: 10,
        backgroundColor: Colors.neutral.border,
        borderRadius: Radius.full,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.sage.base,
        borderRadius: Radius.full,
    },
    progressText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.brownMid,
    },

    logActionBtn: {
        backgroundColor: Colors.terracotta.base,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderRadius: Radius.md,
    },
    logActionBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.white,
    },

    statsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: Spacing.md,
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.background.card,
        borderRadius: Radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        alignItems: 'center',
    },
    statLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: Colors.neutral.muted,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.neutral.brown,
        textAlign: 'center',
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
        marginBottom: 10,
    },
    bodyText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brownMid,
        lineHeight: 20,
    },

    findingItem: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'flex-start',
    },
    findingBullet: {
        fontFamily: 'Nunito-Bold',
        color: Colors.sage.dark,
        marginRight: 6,
        fontSize: 16,
    },
    findingText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        flex: 1,
        lineHeight: 20,
    },

    suggestionCard: {
        backgroundColor: Colors.sage.tint,
        borderColor: Colors.sage.light,
    },
    suggestionTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.sage.dark,
        marginBottom: 6,
    },
    suggestionText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.sage.dark,
        lineHeight: 20,
    },

    summaryCtaBtn: {
        backgroundColor: Colors.sage.dark,
        borderRadius: Radius.lg,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: Spacing.xs,
        marginBottom: Spacing.xl,
    },
    summaryCtaText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.white,
    },
});