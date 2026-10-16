import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Sparkles, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';
import { HomeScreenSkeleton } from '@/components/SkeletonLoader';

const CATEGORY_DOT_COLORS: Record<string, string> = {
  Pain: '#C4714F',
  Fatigue: '#7B9E87',
  Mood: '#B8A0D0',
  Digestion: '#E8B87A',
  Breathing: '#7AAED0',
  Skin: '#E8A0A0',
  General: '#9A9088',
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDarkMode, scaled } = useTheme();

  const [userName, setUserName] = useState('there');
  const [userInitial, setUserInitial] = useState('U');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allSymptoms, setAllSymptoms] = useState<any[]>([]);
  const [recentSymptoms, setRecentSymptoms] = useState<any[]>([]);
  const [hasInsight, setHasInsight] = useState(false);
  const [insightSnippet, setInsightSnippet] = useState<string>('Tap to view your pattern analysis');

  const [loggedTodayCount, setLoggedTodayCount] = useState(0);
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [dayStreak, setDayStreak] = useState(1);
  const [wellnessScore, setWellnessScore] = useState(85);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const user = await getCurrentUser();
      const rawName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
      const firstName = rawName.split(' ')[0] || 'there';
      setUserName(firstName);
      setUserInitial(firstName.charAt(0).toUpperCase() || 'U');

      const res = await api.get('/symptoms/history');
      const symptoms: any[] = res.data.symptoms || [];
      setAllSymptoms(symptoms);
      setRecentSymptoms(symptoms.slice(0, 4));
      setHasInsight(symptoms.length >= 3);

      const todayStr = new Date().toISOString().slice(0, 10);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      let todayCount = 0;
      let monthCount = 0;
      let totalSeverity = 0;
      let sevCount = 0;
      const uniqueDays = new Set<string>();

      symptoms.forEach((log) => {
        if (log.created_at) {
          const logDate = new Date(log.created_at);
          const dateStr = log.created_at.slice(0, 10);
          uniqueDays.add(dateStr);

          if (dateStr === todayStr) {
            todayCount++;
          }
          if (logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth) {
            monthCount++;
          }
        }

        if (log.severity !== undefined && log.severity !== null) {
          totalSeverity += Number(log.severity);
          sevCount++;
        }
      });

      setLoggedTodayCount(todayCount);
      setThisMonthCount(monthCount);
      setDayStreak(Math.max(1, Math.min(uniqueDays.size, 30)));

      if (symptoms.length === 0) {
        setWellnessScore(95);
      } else {
        const avgSev = sevCount > 0 ? totalSeverity / sevCount : 4;
        const calculatedScore = Math.max(20, Math.min(100, Math.round(100 - avgSev * 6.5 - todayCount * 3)));
        setWellnessScore(calculatedScore);
      }

      if (symptoms.length >= 3) {
        try {
          const patternRes = await api.get('/analysis/patterns');
          if (patternRes.data?.ready && patternRes.data?.analysis) {
            const ana = patternRes.data.analysis;
            if (ana.key_findings && ana.key_findings.length > 0) {
              const f = ana.key_findings[0];
              setInsightSnippet(f.description || f.title || 'Patterns identified in your logs');
            } else if (ana.time_pattern) {
              setInsightSnippet(`Time trend: ${ana.time_pattern}`);
            }
          }
        } catch {
          // Fallback
        }
      }
    } catch (error) {
      console.log('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getCategoryFromDesc = (desc: string): string => {
    const lower = (desc || '').toLowerCase();
    if (lower.includes('pain') || lower.includes('headache') || lower.includes('cramp')) return 'Pain';
    if (lower.includes('fatigue') || lower.includes('energy') || lower.includes('tired')) return 'Fatigue';
    if (lower.includes('mood') || lower.includes('anxiety') || lower.includes('depress') || lower.includes('stress')) return 'Mood';
    if (lower.includes('digest') || lower.includes('stomach') || lower.includes('nausea') || lower.includes('bloat')) return 'Digestion';
    if (lower.includes('breath') || lower.includes('cough') || lower.includes('chest')) return 'Breathing';
    if (lower.includes('skin') || lower.includes('rash') || lower.includes('itch')) return 'Skin';
    return 'General';
  };

  const formatLogSubtitle = (log: any): string => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let prefix = 'Recent';

    if (log.created_at) {
      const dateKey = log.created_at.slice(0, 10);
      const timePart = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (dateKey === todayStr) {
        prefix = `Today, ${timePart}`;
      } else if (dateKey === yesterdayStr) {
        prefix = `Yesterday, ${timePart}`;
      } else {
        const d = new Date(log.created_at);
        prefix = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } else {
      prefix = log.time_of_day || 'Recent';
    }

    const match = log.description?.match(/\((.*?)\)/);
    const area = match ? match[1] : '';

    return area ? `${prefix} · ${area}` : prefix;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.dateText, { color: colors.neutral.muted, fontSize: scaled(12.5) }]}>
              {todayFormatted}
            </Text>
            <Text style={[styles.greetingTitle, { color: colors.neutral.brown, fontSize: scaled(24) }]}>
              {getGreeting()}, {userName}
            </Text>
          </View>
          {/* Avatar initial circle */}
          <View style={[styles.avatarCircle, { backgroundColor: colors.sage.base, borderColor: colors.sage.light }]}>
            <Text style={[styles.avatarText, { fontSize: scaled(18) }]}>{userInitial}</Text>
          </View>
        </View>

        {loading ? (
          <HomeScreenSkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          >
            {/* TODAY'S WELLNESS CARD */}
            <View style={[styles.wellnessCard, { backgroundColor: isDarkMode ? '#233328' : '#5A7D66' }]}>
              <View style={styles.wellnessAmbientCircle} />

              <Text style={[styles.wellnessLabel, { fontSize: scaled(11) }]}>TODAY'S WELLNESS</Text>

              <View style={styles.wellnessScoreRow}>
                <Text style={[styles.wellnessScoreNumber, { fontSize: scaled(38) }]}>{wellnessScore}</Text>
                <Text style={[styles.wellnessScoreMax, { fontSize: scaled(16) }]}>/100</Text>
              </View>

              <Text style={[styles.wellnessTrendText, { fontSize: scaled(12) }]}>▲ 8 pts from yesterday</Text>

              {/* 3 Stat Sub-Boxes */}
              <View style={styles.wellnessStatsRow}>
                <View style={styles.wellnessStatBox}>
                  <Text style={[styles.wellnessStatVal, { fontSize: scaled(18) }]}>{dayStreak}</Text>
                  <Text style={[styles.wellnessStatName, { fontSize: scaled(10.5) }]}>Day Streak</Text>
                </View>
                <View style={styles.wellnessStatBox}>
                  <Text style={[styles.wellnessStatVal, { fontSize: scaled(18) }]}>{loggedTodayCount}</Text>
                  <Text style={[styles.wellnessStatName, { fontSize: scaled(10.5) }]}>Logged Today</Text>
                </View>
                <View style={styles.wellnessStatBox}>
                  <Text style={[styles.wellnessStatVal, { fontSize: scaled(18) }]}>{thisMonthCount}</Text>
                  <Text style={[styles.wellnessStatName, { fontSize: scaled(10.5) }]}>This Month</Text>
                </View>
              </View>
            </View>

            {/* LOG A SYMPTOM BUTTON */}
            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: colors.terracotta.base }]}
              onPress={() => router.push('/(tabs)/log' as any)}
              activeOpacity={0.85}
            >
              <Plus size={scaled(18)} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[styles.logButtonText, { fontSize: scaled(16) }]}>Log a Symptom</Text>
            </TouchableOpacity>

            {/* RECENT SYMPTOMS HEADER */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.neutral.brown, fontSize: scaled(16) }]}>
                Recent Symptoms
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/timeline' as any)} activeOpacity={0.7}>
                <Text style={[styles.seeAllText, { color: colors.sage.dark, fontSize: scaled(13) }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* RECENT SYMPTOM LIST */}
            {recentSymptoms.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
                <CalendarIcon size={scaled(30)} color={colors.neutral.muted} style={{ marginBottom: 6 }} />
                <Text style={[styles.emptyText, { color: colors.neutral.brownMid, fontSize: scaled(14) }]}>
                  No symptoms logged yet.
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                  Tap "+ Log a Symptom" above to start tracking.
                </Text>
              </View>
            ) : (
              recentSymptoms.map((symptom: any) => {
                const category = getCategoryFromDesc(symptom.description);
                const dotColor = CATEGORY_DOT_COLORS[category] || CATEGORY_DOT_COLORS.General;
                const bgTint = isDarkMode ? '#2E2822' : '#F6F0E8';
                const cleanTitle = symptom.description ? symptom.description.replace(/\s*\(.*?\)/, '') : 'Symptom';

                return (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[styles.symptomCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}
                    onPress={() => router.push('/(tabs)/timeline' as any)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.symptomDotBox, { backgroundColor: bgTint }]}>
                      <View style={[styles.symptomDot, { backgroundColor: dotColor }]} />
                    </View>

                    <View style={styles.symptomDetails}>
                      <Text style={[styles.symptomTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                        {cleanTitle}
                      </Text>
                      <Text style={[styles.symptomSubtitle, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                        {formatLogSubtitle(symptom)}
                      </Text>
                    </View>

                    {symptom.severity !== undefined && symptom.severity !== null && (
                      <View style={styles.severityContainer}>
                        <Text style={[styles.severityNumber, { color: dotColor, fontSize: scaled(16) }]}>
                          {symptom.severity}
                        </Text>
                        <Text style={[styles.severityMax, { color: colors.neutral.muted, fontSize: scaled(10) }]}>
                          /10
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {/* AI INSIGHT BANNER */}
            {hasInsight && (
              <TouchableOpacity
                style={[
                  styles.insightBanner,
                  {
                    backgroundColor: isDarkMode ? '#1E2C22' : '#EBF3EE',
                    borderColor: isDarkMode ? '#2F4837' : '#D4E7DC',
                  },
                ]}
                onPress={() => router.push('/(tabs)/insights' as any)}
                activeOpacity={0.85}
              >
                <View style={[styles.insightIconCircle, { backgroundColor: isDarkMode ? '#2D4535' : '#D4E7DC' }]}>
                  <Sparkles size={scaled(18)} color={colors.sage.dark} />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={[styles.insightTitle, { color: colors.sage.dark, fontSize: scaled(14) }]}>
                    New AI insight ready
                  </Text>
                  <Text style={[styles.insightSubtext, { color: colors.neutral.brownMid, fontSize: scaled(12) }]} numberOfLines={1}>
                    {insightSnippet}
                  </Text>
                </View>
                <ChevronRight size={scaled(18)} color={colors.sage.dark} />
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  dateText: {
    fontFamily: 'Nunito-Medium',
    marginBottom: 2,
  },
  greetingTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  avatarText: {
    fontFamily: 'DMSerifDisplay-Regular',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  wellnessCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  wellnessAmbientCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  wellnessLabel: {
    fontFamily: 'Nunito-Bold',
    color: '#D4E7DC',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  wellnessScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wellnessScoreNumber: {
    fontFamily: 'DMSerifDisplay-Regular',
    color: '#FFFFFF',
  },
  wellnessScoreMax: {
    fontFamily: 'Nunito-Bold',
    color: '#D4E7DC',
    marginLeft: 4,
  },
  wellnessTrendText: {
    fontFamily: 'Nunito-Medium',
    color: '#E5F1EB',
    marginBottom: Spacing.md,
  },
  wellnessStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  wellnessStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  wellnessStatVal: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  wellnessStatName: {
    fontFamily: 'Nunito-Medium',
    color: '#D4E7DC',
    marginTop: 2,
  },
  logButton: {
    borderRadius: Radius.lg,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    elevation: 3,
  },
  logButtonText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
  },
  seeAllText: {
    fontFamily: 'Nunito-Bold',
  },
  symptomCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  symptomDotBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symptomDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  symptomDetails: {
    flex: 1,
  },
  symptomTitle: {
    fontFamily: 'Nunito-Bold',
    marginBottom: 2,
  },
  symptomSubtitle: {
    fontFamily: 'Nunito-Medium',
  },
  severityContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  severityNumber: {
    fontFamily: 'Nunito-Bold',
  },
  severityMax: {
    fontFamily: 'Nunito-Medium',
  },
  emptyCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontFamily: 'Nunito-Bold',
    marginBottom: 2,
  },
  emptySubtext: {
    fontFamily: 'Nunito-Medium',
  },
  insightBanner: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightTextContainer: {
    flex: 1,
    marginRight: 6,
  },
  insightTitle: {
    fontFamily: 'Nunito-Bold',
    marginBottom: 2,
  },
  insightSubtext: {
    fontFamily: 'Nunito-Medium',
  },
});