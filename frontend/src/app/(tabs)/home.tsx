import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';

export default function Home() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [recentSymptoms, setRecentSymptoms] = useState([]);
    const [hasInsight, setHasInsight] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            setUserName(user?.user_metadata?.name?.split(' ')[0] || 'there');

            const response = await api.get('/symptoms/history');
            const symptoms = response.data.symptoms.slice(0, 3);
            setRecentSymptoms(symptoms);
            setHasInsight(response.data.symptoms.length >= 3);
        } catch (error) {
            console.log('Error loading data:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.name}>{userName}</Text>
                        </View>
                    </View>

                    {/* Log button */}
                    <TouchableOpacity
                        style={styles.logButton}
                        onPress={() => router.push('/(tabs)/log' as any)}
                        activeOpacity={0.8}>
                        <Text style={styles.logButtonText}>+ Log a Symptom</Text>
                    </TouchableOpacity>

                    {/* Recent symptoms */}
                    <Text style={styles.sectionTitle}>Recent Symptoms</Text>
                    {recentSymptoms.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No symptoms logged yet.</Text>
                            <Text style={styles.emptySubtext}>Tap "Log a Symptom" to get started.</Text>
                        </View>
                    ) : (
                        recentSymptoms.map((symptom: any) => (
                            <View key={symptom.id} style={styles.symptomCard}>
                                <Text style={styles.symptomDescription}>{symptom.description}</Text>
                                <View style={styles.symptomMeta}>
                                    <Text style={styles.symptomTime}>{symptom.time_of_day}</Text>
                                    {symptom.severity && (
                                        <Text style={styles.symptomSeverity}>{symptom.severity}/10</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}

                    {/* AI insight banner */}
                    {hasInsight && (
                        <TouchableOpacity
                            style={styles.insightBanner}
                            onPress={() => router.push('/(tabs)/insights' as any)}
                            activeOpacity={0.8}>
                            <Text style={styles.insightTitle}>New AI insight ready</Text>
                            <Text style={styles.insightSubtext}>Tap to view your pattern analysis →</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background.canvas },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    greeting: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
    name: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.h1,
        color: Colors.neutral.brown,
    },
    logButton: {
        backgroundColor: Colors.terracotta.base,
        marginHorizontal: Spacing.lg,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    logButtonText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.background.card,
    },
    sectionTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.label,
        color: Colors.neutral.muted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    emptyCard: {
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.background.card,
        borderRadius: Radius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    emptyText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brownMid,
        marginBottom: 4,
    },
    emptySubtext: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
    symptomCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
        backgroundColor: Colors.background.card,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    symptomDescription: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        flex: 1,
    },
    symptomMeta: { alignItems: 'flex-end' },
    symptomTime: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
    symptomSeverity: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
        color: Colors.terracotta.base,
    },
    insightBanner: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
        backgroundColor: Colors.sage.tint,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.sage.light,
    },
    insightTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.sage.dark,
        marginBottom: 4,
    },
    insightSubtext: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.sage.base,
    },
});