import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

const CATEGORIES = [
    { name: 'Pain', icon: '⚡' },
    { name: 'Fatigue', icon: '🌙' },
    { name: 'Mood', icon: '💭' },
    { name: 'Digestion', icon: '🌿' },
    { name: 'Breathing', icon: '💨' },
    { name: 'Skin', icon: '✨' },
];

const BODY_AREAS = ['Head', 'Neck', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'General'];

const TIME_OPTIONS = ['now', '1h ago', '3h ago', 'earlier'];

export default function LogSymptomScreen() {
    const router = useRouter();

    const [selectedCategory, setSelectedCategory] = useState('Pain');
    const [selectedBodyArea, setSelectedBodyArea] = useState('Head');
    const [severity, setSeverity] = useState<number>(5);
    const [whenStarted, setWhenStarted] = useState('now');
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async () => {
        const fullDescription = notes.trim()
            ? `${selectedCategory} (${selectedBodyArea}) - ${notes.trim()}`
            : `${selectedCategory} (${selectedBodyArea})`;

        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            const payload = {
                description: fullDescription,
                severity,
                time_of_day: whenStarted === 'now' ? 'Present' : whenStarted,
                mood: selectedCategory === 'Mood' ? 'Stressed' : 'Neutral',
                triggers: [
                    { trigger_type: 'category', trigger_value: selectedCategory },
                    { trigger_type: 'body_area', trigger_value: selectedBodyArea },
                ],
            };

            await api.post('/symptoms/log', payload);

            setSuccessMsg('Symptom logged successfully!');
            setNotes('');
            setSeverity(5);

            setTimeout(() => {
                setSuccessMsg(null);
                router.push('/(tabs)/home' as any);
            }, 1200);
        } catch (err: any) {
            const message = err.response?.data?.detail || err.message || 'Failed to log symptom';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (val: number) => {
        if (val <= 3) return Colors.sage.base;
        if (val <= 6) return '#D97706';
        return Colors.terracotta.base;
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Log a Symptom</Text>
                    </View>

                    {/* Feedback Messages */}
                    {errorMsg && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    )}
                    {successMsg && (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>✓ {successMsg}</Text>
                        </View>
                    )}

                    {/* CATEGORY Grid */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>CATEGORY</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.name;
                                return (
                                    <TouchableOpacity
                                        key={cat.name}
                                        style={[styles.categoryTile, isSelected && styles.categoryTileSelected]}
                                        onPress={() => setSelectedCategory(cat.name)}
                                        activeOpacity={0.8}>
                                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* BODY AREA Horizontal / Wrapped Pills */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>BODY AREA</Text>
                        <View style={styles.pillsRow}>
                            {BODY_AREAS.map((area) => {
                                const isSelected = selectedBodyArea === area;
                                return (
                                    <TouchableOpacity
                                        key={area}
                                        style={[styles.areaPill, isSelected && styles.areaPillSelected]}
                                        onPress={() => setSelectedBodyArea(area)}>
                                        <Text style={[styles.areaPillText, isSelected && styles.areaPillTextSelected]}>
                                            {area}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* SEVERITY Card */}
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.sectionLabel}>SEVERITY</Text>
                            <Text style={[styles.severityValueText, { color: getSeverityColor(severity) }]}>
                                {severity}<Text style={styles.severityDenom}>/10</Text>
                            </Text>
                        </View>

                        <View style={styles.severityPillsContainer}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                                const isSelected = severity === num;
                                return (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            styles.severityPill,
                                            isSelected && { backgroundColor: getSeverityColor(num), borderColor: getSeverityColor(num) },
                                        ]}
                                        onPress={() => setSeverity(num)}
                                        activeOpacity={0.7}>
                                        <Text style={[styles.severityPillText, isSelected && { color: Colors.white }]}>
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.rowBetween}>
                            <Text style={[styles.rangeLabel, { color: Colors.sage.base }]}>Mild</Text>
                            <Text style={[styles.rangeLabel, { color: '#D97706' }]}>Moderate</Text>
                            <Text style={[styles.rangeLabel, { color: Colors.terracotta.base }]}>Severe</Text>
                        </View>
                    </View>

                    {/* WHEN DID IT START? */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>WHEN DID IT START?</Text>
                        <View style={styles.pillsRow}>
                            {TIME_OPTIONS.map((time) => {
                                const isSelected = whenStarted === time;
                                return (
                                    <TouchableOpacity
                                        key={time}
                                        style={[styles.timePill, isSelected && styles.timePillSelected]}
                                        onPress={() => setWhenStarted(time)}>
                                        <Text style={[styles.timePillText, isSelected && styles.timePillTextSelected]}>
                                            {time}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* NOTES (OPTIONAL) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Describe how you feel, any triggers you noticed..."
                            placeholderTextColor={Colors.neutral.muted}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}>
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.submitBtnText}>Save Symptom Log</Text>
                        )}
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

    header: { marginBottom: Spacing.lg },
    title: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
    },

    errorBox: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    errorText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: '#991B1B',
    },
    successBox: {
        backgroundColor: Colors.sage.tint,
        borderColor: Colors.sage.base,
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    successText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.sage.dark,
    },

    section: { marginBottom: Spacing.lg },
    sectionLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.label,
        color: Colors.neutral.muted,
        letterSpacing: 1,
        marginBottom: 10,
        textTransform: 'uppercase',
    },

    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryTile: {
        width: '31%',
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    categoryTileSelected: {
        backgroundColor: Colors.terracotta.base,
        borderColor: Colors.terracotta.base,
    },
    categoryIcon: { fontSize: 24, marginBottom: 6 },
    categoryText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    categoryTextSelected: {
        color: Colors.white,
    },

    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    areaPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: Radius.full,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    areaPillSelected: {
        backgroundColor: Colors.sage.base,
        borderColor: Colors.sage.base,
    },
    areaPillText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    areaPillTextSelected: {
        color: Colors.white,
    },

    card: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    severityValueText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.h2,
    },
    severityDenom: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },

    severityPillsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 14,
    },
    severityPill: {
        width: 28,
        height: 34,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background.canvas,
    },
    severityPillText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.brown,
    },
    rangeLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
    },

    timePill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: Radius.full,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    timePillSelected: {
        backgroundColor: Colors.neutral.brown,
        borderColor: Colors.neutral.brown,
    },
    timePillText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    timePillTextSelected: {
        color: Colors.white,
    },

    textArea: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        minHeight: 100,
        textAlignVertical: 'top',
    },

    submitBtn: {
        backgroundColor: Colors.terracotta.base,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
    },
    btnDisabled: { opacity: 0.6 },
    submitBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.white,
    },
});