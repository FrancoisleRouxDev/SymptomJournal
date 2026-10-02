import React, { useEffect, useState, useMemo } from 'react';
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

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function TimelineScreen() {
    const [symptoms, setSymptoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDay, setSelectedDay] = useState<number | null>(19);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await api.get('/symptoms/history');
            setSymptoms(response.data.symptoms || []);
        } catch (error) {
            console.log('Error fetching timeline:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const categories = ['All', 'Pain', 'Fatigue', 'Mood', 'Digestion'];

    const getSeverityColor = (val: number) => {
        if (val <= 3) return Colors.sage.base;
        if (val <= 6) return '#D97706';
        return Colors.terracotta.base;
    };

    const getCategoryBadgeStyle = (cat: string) => {
        const lower = cat.toLowerCase();
        if (lower.includes('pain')) return { bg: Colors.terracotta.tint, text: Colors.terracotta.dark };
        if (lower.includes('fatigue')) return { bg: Colors.sage.tint, text: Colors.sage.dark };
        if (lower.includes('mood')) return { bg: '#F3E8FF', text: '#6B21A8' };
        if (lower.includes('digestion')) return { bg: '#FEF3C7', text: '#92400E' };
        return { bg: Colors.neutral.border, text: Colors.neutral.brown };
    };

    // Filter symptoms
    const filteredSymptoms = useMemo(() => {
        return symptoms.filter((item) => {
            if (selectedCategory === 'All') return true;
            return item.description.toLowerCase().includes(selectedCategory.toLowerCase());
        });
    }, [symptoms, selectedCategory]);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.sage.dark]} />}>

                    {/* Header */}
                    <Text style={styles.title}>Symptom Timeline</Text>

                    {/* Monthly Calendar Widget */}
                    <View style={styles.calendarCard}>
                        <View style={styles.calendarHeader}>
                            <Text style={styles.calendarTitle}>September 2026</Text>
                            <View style={styles.arrowsRow}>
                                <TouchableOpacity style={styles.arrowBtn}><Text style={styles.arrowText}>‹</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.arrowBtn}><Text style={styles.arrowText}>›</Text></TouchableOpacity>
                            </View>
                        </View>

                        {/* Weekday Labels */}
                        <View style={styles.weekdaysRow}>
                            {WEEKDAYS.map((w) => (
                                <Text key={w} style={styles.weekdayLabel}>{w}</Text>
                            ))}
                        </View>

                        {/* Days Grid */}
                        <View style={styles.daysGrid}>
                            {/* Empty offset days for Month start */}
                            <View style={styles.dayCell} /><View style={styles.dayCell} />
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((day) => {
                                const isSelected = selectedDay === day;
                                const hasSymptomDot = [3, 5, 8, 11, 14, 15, 17, 18, 19].includes(day);
                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                                        onPress={() => setSelectedDay(day)}>
                                        <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected]}>
                                            {day}
                                        </Text>
                                        {hasSymptomDot && !isSelected && (
                                            <View style={styles.symptomDot} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Filter Pills Row */}
                    <View style={styles.filterRow}>
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                                    onPress={() => setSelectedCategory(cat)}>
                                    <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Timeline Feed */}
                    <Text style={styles.sectionDateHeader}>TODAY — SEP 19</Text>

                    {loading ? (
                        <ActivityIndicator color={Colors.terracotta.base} style={{ marginVertical: 20 }} />
                    ) : filteredSymptoms.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>No symptoms recorded for this day</Text>
                            <Text style={styles.emptySub}>Logged symptoms will appear chronologically here.</Text>
                        </View>
                    ) : (
                        filteredSymptoms.map((item) => {
                            const categoryName = item.description.includes('(')
                                ? item.description.split('(')[0].trim()
                                : 'Pain';
                            const badgeStyle = getCategoryBadgeStyle(categoryName);
                            const timeFormatted = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <View key={item.id} style={styles.timelineItemRow}>
                                    {/* Left Dot Indicator */}
                                    <View style={[styles.timelineDot, { backgroundColor: getSeverityColor(item.severity) }]} />

                                    {/* Card */}
                                    <View style={styles.symptomCard}>
                                        <View style={styles.cardMainInfo}>
                                            <Text style={styles.symptomTitle}>{item.description}</Text>
                                            <Text style={styles.symptomTime}>{timeFormatted}</Text>
                                        </View>
                                        <View style={styles.cardRightCol}>
                                            <View style={[styles.categoryBadge, { backgroundColor: badgeStyle.bg }]}>
                                                <Text style={[styles.categoryBadgeText, { color: badgeStyle.text }]}>
                                                    {categoryName}
                                                </Text>
                                            </View>
                                            <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
                                                {item.severity}<Text style={styles.severityDenom}>/10</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
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

    title: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
        marginBottom: Spacing.lg,
    },

    calendarCard: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.xl,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    calendarTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.neutral.brown,
    },
    arrowsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    arrowBtn: {
        width: 28,
        height: 28,
        borderRadius: Radius.full,
        backgroundColor: Colors.background.canvas,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: Colors.neutral.brownMid,
    },

    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekdayLabel: {
        width: 38,
        textAlign: 'center',
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },

    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    dayCell: {
        width: 38,
        height: 38,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    dayCellSelected: {
        backgroundColor: Colors.sage.base,
    },
    dayNumText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.brown,
    },
    dayNumTextSelected: {
        color: Colors.white,
    },
    symptomDot: {
        width: 4,
        height: 4,
        borderRadius: Radius.full,
        backgroundColor: Colors.terracotta.base,
        position: 'absolute',
        bottom: 4,
    },

    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: Spacing.lg,
    },
    filterPill: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: Radius.full,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    filterPillSelected: {
        backgroundColor: Colors.neutral.brown,
        borderColor: Colors.neutral.brown,
    },
    filterPillText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.brown,
    },
    filterPillTextSelected: {
        color: Colors.white,
    },

    sectionDateHeader: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.label,
        color: Colors.neutral.muted,
        letterSpacing: 1,
        marginBottom: 12,
    },

    emptyCard: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
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

    timelineItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: Radius.full,
        marginRight: 12,
    },
    symptomCard: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    cardMainInfo: { flex: 1 },
    symptomTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    symptomTime: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        marginTop: 2,
    },
    cardRightCol: {
        alignItems: 'flex-end',
        gap: 4,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    categoryBadgeText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
    },
    severityText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
    },
    severityDenom: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
});