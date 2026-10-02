import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

interface Trigger {
    id: string;
    log_id: string;
    trigger_type: string;
    trigger_value: string;
}

interface SymptomLog {
    id: string;
    description: string;
    severity: number;
    time_of_day: string;
    mood: string;
    created_at: string;
    triggers?: Trigger[];
}

export default function TimelineScreen() {
    const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await api.get('/symptoms/history');
            setSymptoms(response.data.symptoms || []);
        } catch (error) {
            console.log('Error fetching history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const handleDelete = async (logId: string) => {
        try {
            await api.delete(`/symptoms/history/${logId}`);
            setSymptoms((prev) => prev.filter((s) => s.id !== logId));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete symptom log.');
        }
    };

    const confirmDelete = (logId: string) => {
        Alert.alert(
            'Delete Log',
            'Are you sure you want to delete this symptom log entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDelete(logId) },
            ]
        );
    };

    const getSeverityColor = (val: number) => {
        if (val <= 3) return Colors.sage.base;
        if (val <= 6) return '#D97706';
        return Colors.terracotta.base;
    };

    // Filtered & grouped symptoms
    const filteredSymptoms = useMemo(() => {
        return symptoms.filter((item) => {
            // Search query filter
            const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.triggers?.some((t) => t.trigger_value.toLowerCase().includes(searchQuery.toLowerCase()));

            // Severity filter
            let matchesSeverity = true;
            if (filterSeverity === 'HIGH') matchesSeverity = item.severity >= 7;
            if (filterSeverity === 'MEDIUM') matchesSeverity = item.severity >= 4 && item.severity <= 6;
            if (filterSeverity === 'LOW') matchesSeverity = item.severity <= 3;

            // Date filter
            let matchesDate = true;
            if (selectedDate) {
                const itemDate = new Date(item.created_at).toISOString().split('T')[0];
                matchesDate = itemDate === selectedDate;
            }

            return matchesSearch && matchesSeverity && matchesDate;
        });
    }, [symptoms, searchQuery, filterSeverity, selectedDate]);

    // Format date headers
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Symptom Timeline</Text>
                    <Text style={styles.subtitle}>Your complete symptom history and flare-up patterns</Text>

                    {/* Search & Filter Row */}
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search symptoms or triggers..."
                            placeholderTextColor={Colors.neutral.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Filter Pills */}
                    <View style={styles.filterRow}>
                        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterPill, filterSeverity === f && styles.filterPillSelected]}
                                onPress={() => setFilterSeverity(f)}>
                                <Text style={[styles.filterPillText, filterSeverity === f && styles.filterPillTextSelected]}>
                                    {f === 'ALL' ? 'All Severities' : f === 'HIGH' ? 'Severe (7+)' : f === 'MEDIUM' ? 'Moderate (4-6)' : 'Mild (1-3)'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Timeline List */}
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.terracotta.base} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.terracotta.base]} />}>

                        {filteredSymptoms.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>No symptoms found</Text>
                                <Text style={styles.emptySub}>
                                    {searchQuery || filterSeverity !== 'ALL' || selectedDate
                                        ? 'Try clearing your filters to see more results.'
                                        : 'Logged symptoms will appear here in chronological order.'}
                                </Text>
                            </View>
                        ) : (
                            filteredSymptoms.map((item) => (
                                <View key={item.id} style={styles.logCard}>
                                    
                                    {/* Top Row: Severity Badge & Date */}
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                                            <Text style={styles.severityText}>{item.severity}/10</Text>
                                        </View>
                                        <Text style={styles.dateText}>{formatDate(item.created_at)} • {item.time_of_day}</Text>
                                        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn}>
                                            <Text style={styles.deleteBtnText}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Description */}
                                    <Text style={styles.description}>{item.description}</Text>

                                    {/* Mood Meta */}
                                    {item.mood && (
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Mood:</Text>
                                            <Text style={styles.metaVal}>{item.mood}</Text>
                                        </View>
                                    )}

                                    {/* Triggers Tags */}
                                    {item.triggers && item.triggers.length > 0 && (
                                        <View style={styles.triggersWrapper}>
                                            {item.triggers.map((t) => (
                                                <View key={t.id} style={styles.triggerChip}>
                                                    <Text style={styles.triggerChipText}>
                                                        ⚡ {t.trigger_type}: {t.trigger_value}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))
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
        paddingBottom: Spacing.sm,
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
        marginBottom: Spacing.sm,
    },

    searchRow: { marginBottom: Spacing.xs },
    searchInput: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        backgroundColor: Colors.background.card,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },

    filterRow: {
        flexDirection: 'row',
        gap: 6,
        marginVertical: Spacing.xs,
        flexWrap: 'wrap',
    },
    filterPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.full,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    filterPillSelected: {
        backgroundColor: Colors.terracotta.base,
        borderColor: Colors.terracotta.base,
    },
    filterPillText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.neutral.brownMid,
    },
    filterPillTextSelected: {
        color: Colors.white,
    },

    scrollContent: { padding: Spacing.lg },

    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyCard: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    emptyTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.neutral.brown,
        marginBottom: 4,
    },
    emptySub: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        textAlign: 'center',
    },

    logCard: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    severityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: Radius.full,
        marginRight: 8,
    },
    severityText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.white,
    },
    dateText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        flex: 1,
    },
    deleteBtn: {
        padding: 4,
    },
    deleteBtnText: {
        fontSize: 14,
    },

    description: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        marginBottom: 8,
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    metaLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
    metaVal: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.brownMid,
    },

    triggersWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    triggerChip: {
        backgroundColor: Colors.sage.tint,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.sm,
    },
    triggerChipText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: Colors.sage.dark,
    },
});