import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const MOOD_OPTIONS = ['Good', 'Neutral', 'Stressed', 'Anxious', 'Fatigued'];
const QUICK_TRIGGERS = [
    { type: 'sleep', value: '< 6 hours' },
    { type: 'stress', value: 'High workload' },
    { type: 'food', value: 'Coffee' },
    { type: 'food', value: 'Dairy/Gluten' },
    { type: 'activity', value: 'Intense exercise' },
    { type: 'weather', value: 'Temperature change' },
];

export default function LogSymptomScreen() {
    const router = useRouter();

    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState<number>(5);
    const [timeOfDay, setTimeOfDay] = useState<string>('Afternoon');
    const [mood, setMood] = useState<string>('Neutral');
    const [selectedTriggers, setSelectedTriggers] = useState<Array<{ trigger_type: string; trigger_value: string }>>([]);
    
    // Custom trigger inputs
    const [customType, setCustomType] = useState('');
    const [customValue, setCustomValue] = useState('');
    const [showCustomTrigger, setShowCustomTrigger] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const toggleQuickTrigger = (trigger: { type: string; value: string }) => {
        const exists = selectedTriggers.some(
            (t) => t.trigger_type === trigger.type && t.trigger_value === trigger.value
        );

        if (exists) {
            setSelectedTriggers(
                selectedTriggers.filter(
                    (t) => !(t.trigger_type === trigger.type && t.trigger_value === trigger.value)
                )
            );
        } else {
            setSelectedTriggers([
                ...selectedTriggers,
                { trigger_type: trigger.type, trigger_value: trigger.value },
            ]);
        }
    };

    const addCustomTrigger = () => {
        if (!customType.trim() || !customValue.trim()) return;
        setSelectedTriggers([
            ...selectedTriggers,
            { trigger_type: customType.trim().toLowerCase(), trigger_value: customValue.trim() },
        ]);
        setCustomType('');
        setCustomValue('');
        setShowCustomTrigger(false);
    };

    const removeTrigger = (index: number) => {
        const updated = [...selectedTriggers];
        updated.splice(index, 1);
        setSelectedTriggers(updated);
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            setErrorMsg('Please describe your symptom before submitting.');
            return;
        }

        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            const payload = {
                description: description.trim(),
                severity,
                time_of_day: timeOfDay,
                mood,
                triggers: selectedTriggers,
            };

            await api.post('/symptoms/log', payload);

            setSuccessMsg('Symptom logged successfully!');
            // Reset form
            setDescription('');
            setSeverity(5);
            setSelectedTriggers([]);

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
        if (val <= 6) return '#D97706'; // Amber
        return Colors.terracotta.base; // Red/Terracotta
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Log Symptom</Text>
                        <Text style={styles.subtitle}>Track your symptoms to uncover patterns with AI</Text>
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

                    {/* Description Input */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Symptom Description *</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="e.g. Throbbing headache on the left side with light sensitivity..."
                            placeholderTextColor={Colors.neutral.muted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Severity Slider / Selector */}
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.label}>Severity Level</Text>
                            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) }]}>
                                <Text style={styles.severityBadgeText}>{severity}/10</Text>
                            </View>
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
                            <Text style={styles.helperText}>1 = Mild</Text>
                            <Text style={styles.helperText}>10 = Severe</Text>
                        </View>
                    </View>

                    {/* Time of Day */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Time of Day</Text>
                        <View style={styles.optionsRow}>
                            {TIME_OPTIONS.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[styles.optionPill, timeOfDay === time && styles.optionPillSelected]}
                                    onPress={() => setTimeOfDay(time)}>
                                    <Text style={[styles.optionPillText, timeOfDay === time && styles.optionPillTextSelected]}>
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Mood */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Current Mood</Text>
                        <View style={styles.optionsRow}>
                            {MOOD_OPTIONS.map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[styles.optionPill, mood === m && styles.optionPillSelected]}
                                    onPress={() => setMood(m)}>
                                    <Text style={[styles.optionPillText, mood === m && styles.optionPillTextSelected]}>
                                        {m}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Triggers Section */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Potential Triggers</Text>
                        <Text style={styles.helperText}>Tap quick triggers or add your own:</Text>

                        {/* Quick Triggers */}
                        <View style={styles.quickTriggersGrid}>
                            {QUICK_TRIGGERS.map((t, idx) => {
                                const isSelected = selectedTriggers.some(
                                    (st) => st.trigger_type === t.type && st.trigger_value === t.value
                                );
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.triggerChip, isSelected && styles.triggerChipSelected]}
                                        onPress={() => toggleQuickTrigger(t)}>
                                        <Text style={[styles.triggerChipText, isSelected && styles.triggerChipTextSelected]}>
                                            {t.type}: {t.value} {isSelected ? '✓' : '+'}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Active Selected Triggers List */}
                        {selectedTriggers.length > 0 && (
                            <View style={styles.selectedTriggersContainer}>
                                <Text style={styles.subLabel}>Selected Triggers ({selectedTriggers.length}):</Text>
                                {selectedTriggers.map((st, idx) => (
                                    <View key={idx} style={styles.selectedTriggerItem}>
                                        <Text style={styles.selectedTriggerText}>
                                            <Text style={{ fontFamily: 'Nunito-Bold' }}>{st.trigger_type}:</Text> {st.trigger_value}
                                        </Text>
                                        <TouchableOpacity onPress={() => removeTrigger(idx)}>
                                            <Text style={styles.removeText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Add Custom Trigger Input */}
                        {showCustomTrigger ? (
                            <View style={styles.customTriggerBox}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type (e.g. sleep, medication)"
                                    placeholderTextColor={Colors.neutral.muted}
                                    value={customType}
                                    onChangeText={setCustomType}
                                />
                                <TextInput
                                    style={[styles.input, { marginTop: 8 }]}
                                    placeholder="Value (e.g. late sleep, missed dose)"
                                    placeholderTextColor={Colors.neutral.muted}
                                    value={customValue}
                                    onChangeText={setCustomValue}
                                />
                                <View style={[styles.rowBetween, { marginTop: 12 }]}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCustomTrigger(false)}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.addBtn} onPress={addCustomTrigger}>
                                        <Text style={styles.addBtnText}>Add Trigger</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.addCustomBtn}
                                onPress={() => setShowCustomTrigger(true)}>
                                <Text style={styles.addCustomBtnText}>+ Add Custom Trigger</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}>
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
    container: { flex: 1, backgroundColor: Colors.background.canvas },
    safe: { flex: 1 },
    scrollContent: { padding: Spacing.lg },

    header: { marginBottom: Spacing.lg },
    title: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
    },
    subtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.muted,
        marginTop: 4,
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

    card: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        marginBottom: Spacing.md,
    },

    label: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.neutral.brown,
        marginBottom: 8,
    },
    subLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.brownMid,
        marginBottom: 6,
    },
    helperText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        marginBottom: 8,
    },

    textArea: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        backgroundColor: Colors.background.canvas,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        minHeight: 80,
        textAlignVertical: 'top',
    },

    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    severityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    severityBadgeText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.white,
    },

    severityPillsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    severityPill: {
        width: 30,
        height: 36,
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

    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionPill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        backgroundColor: Colors.background.canvas,
    },
    optionPillSelected: {
        backgroundColor: Colors.sage.base,
        borderColor: Colors.sage.base,
    },
    optionPillText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.brown,
    },
    optionPillTextSelected: {
        color: Colors.white,
    },

    quickTriggersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    triggerChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.md,
        backgroundColor: Colors.background.canvas,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    triggerChipSelected: {
        backgroundColor: Colors.terracotta.tint,
        borderColor: Colors.terracotta.base,
    },
    triggerChipText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.brownMid,
    },
    triggerChipTextSelected: {
        fontFamily: 'Nunito-Bold',
        color: Colors.terracotta.dark,
    },

    selectedTriggersContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral.border,
    },
    selectedTriggerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background.canvas,
        padding: 8,
        borderRadius: Radius.sm,
        marginBottom: 4,
    },
    selectedTriggerText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.brown,
    },
    removeText: {
        fontFamily: 'Nunito-Bold',
        color: Colors.terracotta.base,
        fontSize: 14,
        paddingHorizontal: 6,
    },

    addCustomBtn: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    addCustomBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.sage.dark,
    },

    customTriggerBox: {
        marginTop: 8,
        padding: 12,
        backgroundColor: Colors.background.canvas,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    input: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        backgroundColor: Colors.white,
        borderRadius: Radius.sm,
        padding: 8,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    cancelBtn: {
        padding: 8,
    },
    cancelBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
    addBtn: {
        backgroundColor: Colors.sage.base,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radius.md,
    },
    addBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.white,
    },

    submitBtn: {
        backgroundColor: Colors.terracotta.base,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.white,
    },
});