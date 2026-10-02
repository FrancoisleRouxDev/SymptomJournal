import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

const TOP_SYMPTOMS = [
    { name: 'Tension Headache', count: 9, max: 10, color: Colors.terracotta.base },
    { name: 'Fatigue', count: 7, max: 10, color: Colors.sage.base },
    { name: 'Stomach Cramps', count: 5, max: 10, color: '#D97706' },
    { name: 'Anxiety', count: 4, max: 10, color: '#9333EA' },
    { name: 'Shortness of Breath', count: 2, max: 10, color: '#2563EB' },
];

export default function DoctorSummaryScreen() {
    const [generating, setGenerating] = useState(false);
    const [summaryText, setSummaryText] = useState<string | null>(null);

    const handleExportPDF = () => {
        Alert.alert('Export PDF', 'Preparing clinical PDF report for Sarah Mitchell...');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Top Bar */}
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Doctor Summary</Text>
                        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
                            <Text style={styles.exportBtnText}>↑ Export PDF</Text>
                        </TouchableOpacity>
                    </View>

                    {/* PATIENT REPORT Card (Dark Brown Container) */}
                    <View style={styles.patientCard}>
                        <Text style={styles.patientLabel}>PATIENT REPORT</Text>
                        <Text style={styles.patientName}>Sarah Mitchell</Text>
                        <Text style={styles.patientSub}>Sep 1 – Sep 19, 2026 • 18 days tracked</Text>

                        {/* 3 Stats Row inside dark card */}
                        <View style={styles.darkStatsRow}>
                            <View style={styles.darkStatBox}>
                                <Text style={styles.darkStatNum}>32</Text>
                                <Text style={styles.darkStatLabel}>ENTRIES LOGGED</Text>
                            </View>
                            <View style={styles.darkStatBox}>
                                <Text style={styles.darkStatNum}>6</Text>
                                <Text style={styles.darkStatLabel}>SYMPTOM TYPES</Text>
                            </View>
                            <View style={styles.darkStatBox}>
                                <Text style={styles.darkStatNum}>5.1</Text>
                                <Text style={styles.darkStatLabel}>AVG SEVERITY</Text>
                            </View>
                        </View>
                    </View>

                    {/* MOST FREQUENT SYMPTOMS Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardSectionLabel}>MOST FREQUENT SYMPTOMS</Text>
                        <View style={styles.symptomsList}>
                            {TOP_SYMPTOMS.map((item) => (
                                <View key={item.name} style={styles.symptomRow}>
                                    <View style={styles.symptomNameRow}>
                                        <Text style={styles.symptomName}>{item.name}</Text>
                                        <Text style={styles.symptomCountText}>{item.count}x</Text>
                                    </View>
                                    <View style={styles.progressBarTrack}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                { width: `${(item.count / item.max) * 100}%`, backgroundColor: item.color },
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* PATTERNS & NOTES Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardSectionLabel}>PATTERNS & NOTES</Text>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <Text style={styles.bulletText}>
                                Headaches most common 1–4 PM, often preceded by poor sleep
                            </Text>
                        </View>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <Text style={styles.bulletText}>
                                Digestive symptoms cluster around weekends
                            </Text>
                        </View>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <Text style={styles.bulletText}>
                                Fatigue symptoms improving week-over-week (↓18%)
                            </Text>
                        </View>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <Text style={styles.bulletText}>
                                No symptom-free days longer than 2 consecutive days
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
    exportBtn: {
        backgroundColor: Colors.neutral.brown,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: Radius.full,
    },
    exportBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.white,
    },

    patientCard: {
        backgroundColor: '#3E2D1E',
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    patientLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: 'rgba(255, 255, 255, 0.65)',
        letterSpacing: 1,
        marginBottom: 4,
    },
    patientName: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.h1,
        color: Colors.white,
    },
    patientSub: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
        marginBottom: Spacing.md,
    },

    darkStatsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    darkStatBox: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: Radius.md,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    darkStatNum: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.h2,
        color: Colors.white,
    },
    darkStatLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: 'rgba(255, 255, 255, 0.75)',
        marginTop: 4,
        letterSpacing: 0.5,
    },

    card: {
        backgroundColor: Colors.background.card,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    cardSectionLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.label,
        color: Colors.neutral.muted,
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },

    symptomsList: {
        gap: 14,
    },
    symptomRow: {
        gap: 6,
    },
    symptomNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    symptomName: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
    },
    symptomCountText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: Colors.background.canvas,
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: Radius.full,
    },

    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    bulletDot: {
        width: 8,
        height: 8,
        borderRadius: Radius.full,
        backgroundColor: Colors.sage.base,
        marginTop: 6,
        marginRight: 10,
    },
    bulletText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        flex: 1,
        lineHeight: 20,
    },
});