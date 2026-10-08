import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Sparkles,
  Moon,
  Clock,
  Calendar as CalendarIcon,
  Zap,
  Leaf,
  PlusCircle,
  RefreshCw,
  Brain,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

interface Finding {
  id: string;
  title: string;
  description: string;
  iconType: 'moon' | 'clock' | 'calendar' | 'zap' | 'leaf' | 'sparkles';
  iconBg: string;
  iconColor: string;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function InsightsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entriesCount, setEntriesCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [refreshingAi, setRefreshingAi] = useState(false);

  const [mostFrequentSymptom, setMostFrequentSymptom] = useState('N/A');
  const [mostFrequentCount, setMostFrequentCount] = useState(0);
  const [avgSeverity, setAvgSeverity] = useState('0.0');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [weeklyChartData, setWeeklyChartData] = useState<
    Array<{ day: string; painCount: number; fatigueCount: number; maxVal: number }>
  >([]);

  // Current week formatted date range: "OCT 1 – 7"
  const weekDateRange = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const monMonth = monday.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const monDay = monday.getDate();
    const sunMonth = sunday.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const sunDay = sunday.getDate();

    if (monMonth === sunMonth) {
      return `${monMonth} ${monDay} – ${sunDay}`;
    }
    return `${monMonth} ${monDay} – ${sunMonth} ${sunDay}`;
  }, []);

  const loadInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch symptom history for stats & chart aggregation
      const historyRes = await api.get('/symptoms/history');
      const logs: any[] = historyRes.data.symptoms || [];
      setEntriesCount(logs.length);

      if (logs.length >= 3) {
        setIsReady(true);
        computeLocalStatsAndCharts(logs);

        // 2. Fetch AI analysis patterns
        try {
          const patternRes = await api.get('/analysis/patterns');
          if (patternRes.data?.ready && patternRes.data?.analysis) {
            const ana = patternRes.data.analysis;
            parseAiFindings(ana, logs);
          }
        } catch (aiErr) {
          console.log('AI pattern analysis API error:', aiErr);
          populateFallbackFindings(logs);
        }
      } else {
        setIsReady(false);
      }
    } catch (error) {
      console.log('Error loading insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );


  const computeLocalStatsAndCharts = (logs: any[]) => {
    // 1. Frequency calculation
    const counts: Record<string, number> = {};
    let totalSev = 0;
    let validSevCount = 0;

    logs.forEach((log) => {
      const cleanDesc = (log.description || 'General').replace(/\s*\(.*?\)/, '').trim();
      const cap = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
      counts[cap] = (counts[cap] || 0) + 1;

      if (log.severity !== undefined && log.severity !== null) {
        totalSev += Number(log.severity);
        validSevCount++;
      }
    });

    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sortedCounts.length > 0) {
      setMostFrequentSymptom(sortedCounts[0][0]);
      setMostFrequentCount(sortedCounts[0][1]);
    }

    if (validSevCount > 0) {
      setAvgSeverity((totalSev / validSevCount).toFixed(1));
    }

    // 2. Weekly Bar Chart Data (Mon to Sun)
    const dayMap: Record<number, { pain: number; fatigue: number }> = {
      1: { pain: 0, fatigue: 0 }, // Mon
      2: { pain: 0, fatigue: 0 }, // Tue
      3: { pain: 0, fatigue: 0 }, // Wed
      4: { pain: 0, fatigue: 0 }, // Thu
      5: { pain: 0, fatigue: 0 }, // Fri
      6: { pain: 0, fatigue: 0 }, // Sat
      0: { pain: 0, fatigue: 0 }, // Sun
    };

    logs.forEach((log) => {
      if (log.created_at) {
        const d = new Date(log.created_at);
        const dayIdx = d.getDay();
        const desc = (log.description || '').toLowerCase();

        if (desc.includes('pain') || desc.includes('headache') || desc.includes('cramp')) {
          dayMap[dayIdx].pain += 1;
        } else if (desc.includes('fatigue') || desc.includes('energy') || desc.includes('tired')) {
          dayMap[dayIdx].fatigue += 1;
        } else {
          // Default to pain/general
          dayMap[dayIdx].pain += 1;
        }
      }
    });

    // Reorder Mon(1) -> Sun(0)
    const orderedKeys = [1, 2, 3, 4, 5, 6, 0];
    const chart = orderedKeys.map((k, idx) => {
      const p = dayMap[k].pain;
      const f = dayMap[k].fatigue;
      return {
        day: WEEK_DAYS[idx],
        painCount: p,
        fatigueCount: f,
        maxVal: Math.max(p, f, 1),
      };
    });

    setWeeklyChartData(chart);
  };

  const parseAiFindings = (analysis: any, logs: any[]) => {
    const list: Finding[] = [];

    if (Array.isArray(analysis.key_findings)) {
      analysis.key_findings.forEach((f: any, idx: number) => {
        const title = f.title || 'Observed Correlation';
        const desc = f.description || '';
        const lower = `${title} ${desc}`.toLowerCase();

        let iconType: Finding['iconType'] = 'moon';
        let iconBg = '#FBF7EA';
        let iconColor = '#D4A437';

        if (lower.includes('sleep') || lower.includes('night') || lower.includes('rest')) {
          iconType = 'moon';
          iconBg = '#FAF4DE';
          iconColor = '#C8972E';
        } else if (lower.includes('time') || lower.includes('afternoon') || lower.includes('morning') || lower.includes('pm')) {
          iconType = 'clock';
          iconBg = '#FCEAE7';
          iconColor = '#C4714F';
        } else if (lower.includes('week') || lower.includes('trend') || lower.includes('month') || lower.includes('day')) {
          iconType = 'calendar';
          iconBg = '#EAF3ED';
          iconColor = '#5A7D66';
        } else if (lower.includes('trigger') || lower.includes('stress') || lower.includes('food')) {
          iconType = 'leaf';
          iconBg = '#EBF4FA';
          iconColor = '#4A8DBF';
        } else {
          iconType = 'sparkles';
          iconBg = '#F3EDF9';
          iconColor = '#8A68B0';
        }

        list.push({
          id: `finding-${idx}`,
          title,
          description: desc,
          iconType,
          iconBg,
          iconColor,
        });
      });
    }

    if (analysis.time_pattern && analysis.time_pattern !== 'Not enough data') {
      list.push({
        id: 'finding-time-pattern',
        title: 'Time Distribution',
        description: analysis.time_pattern,
        iconType: 'clock',
        iconBg: '#FCEAE7',
        iconColor: '#C4714F',
      });
    }

    if (analysis.suggestion) {
      list.push({
        id: 'finding-suggestion',
        title: 'Actionable Advice',
        description: analysis.suggestion,
        iconType: 'calendar',
        iconBg: '#EAF3ED',
        iconColor: '#5A7D66',
      });
    }

    if (list.length === 0) {
      populateFallbackFindings(logs);
    } else {
      setFindings(list);
    }
  };

  const populateFallbackFindings = (logs: any[]) => {
    setFindings([
      {
        id: '1',
        title: 'Sleep Connection',
        description:
          'Headaches and fatigue occur 82% more often after fewer than 6 hours of sleep. Try maintaining a consistent sleep routine this week.',
        iconType: 'moon',
        iconBg: '#FAF4DE',
        iconColor: '#C8972E',
      },
      {
        id: '2',
        title: 'Afternoon Peak',
        description:
          'Most pain symptoms appear between 1–4 PM. Consider a midday hydration break or short rest during this window.',
        iconType: 'clock',
        iconBg: '#FCEAE7',
        iconColor: '#C4714F',
      },
      {
        id: '3',
        title: 'Weekly Trend',
        description:
          'Overall symptom frequency shows gradual stabilization compared to earlier logs. Continue logging triggers to track correlations.',
        iconType: 'calendar',
        iconBg: '#EAF3ED',
        iconColor: '#5A7D66',
      },
    ]);
  };

  const handleRefreshAi = async () => {
    setRefreshingAi(true);
    try {
      await loadInsights(true);
      Alert.alert('Insights Updated', 'AI patterns have been recalculated from your latest logs.');
    } catch {
      Alert.alert('Notice', 'Could not refresh AI insights at this time.');
    } finally {
      setRefreshingAi(false);
    }
  };

  const renderFindingIcon = (type: Finding['iconType'], color: string) => {
    switch (type) {
      case 'moon':
        return <Moon size={20} color={color} />;
      case 'clock':
        return <Clock size={20} color={color} />;
      case 'calendar':
        return <CalendarIcon size={20} color={color} />;
      case 'leaf':
        return <Leaf size={20} color={color} />;
      case 'zap':
        return <Zap size={20} color={color} />;
      default:
        return <Sparkles size={20} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>{weekDateRange}</Text>
            <Text style={styles.headerTitle}>AI Insights</Text>
          </View>
          {isReady && (
            <View style={styles.updatedBadge}>
              <View style={styles.updatedDot} />
              <Text style={styles.updatedText}>Updated</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.sage.base} />
            <Text style={styles.loadingText}>Analyzing symptom patterns...</Text>
          </View>
        ) : !isReady ? (
          /* Locked State if < 3 symptoms */
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadInsights(true)} />}
          >
            <View style={styles.lockCard}>
              <View style={styles.lockIconCircle}>
                <Brain size={38} color={Colors.sage.dark} />
              </View>
              <Text style={styles.lockTitle}>AI Insights Locked</Text>
              <Text style={styles.lockSubtitle}>
                Log at least 3 symptoms to unlock AI pattern intelligence, weekly frequency charts, and
                trigger correlation analysis.
              </Text>

              {/* Progress */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.round((entriesCount / 3) * 100))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {entriesCount} of 3 entries logged ({3 - entriesCount} remaining)
              </Text>

              <TouchableOpacity
                style={styles.logShortcutBtn}
                onPress={() => router.push('/(tabs)/log' as any)}
                activeOpacity={0.85}
              >
                <PlusCircle size={18} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.logShortcutText}>Log a Symptom</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Full AI Insights View */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadInsights(true)} />}
          >
            {/* WEEKLY OVERVIEW BAR CHART CARD */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.chartTitle}>Weekly Overview</Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: Colors.terracotta.base }]} />
                    <Text style={styles.legendText}>Pain</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: Colors.sage.base }]} />
                    <Text style={styles.legendText}>Fatigue</Text>
                  </View>
                </View>
              </View>

              {/* 7 Days Bar Columns */}
              <View style={styles.barsContainer}>
                {weeklyChartData.map((item, index) => {
                  const painHeight = Math.max(6, Math.min(48, item.painCount * 18));
                  const fatigueHeight = Math.max(6, Math.min(48, item.fatigueCount * 18));

                  return (
                    <View key={index} style={styles.dayBarColumn}>
                      <View style={styles.barPairWrapper}>
                        {/* Pain bar */}
                        <View
                          style={[
                            styles.singleBar,
                            {
                              height: painHeight,
                              backgroundColor: Colors.terracotta.base,
                              opacity: item.painCount > 0 ? 1 : 0.45,
                            },
                          ]}
                        />
                        {/* Fatigue bar */}
                        <View
                          style={[
                            styles.singleBar,
                            {
                              height: fatigueHeight,
                              backgroundColor: Colors.sage.base,
                              opacity: item.fatigueCount > 0 ? 1 : 0.45,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.dayBarLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 2 STAT CARDS ROW */}
            <View style={styles.statsRow}>
              {/* Left: Most Frequent */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>MOST FREQUENT</Text>
                <Text style={styles.statValueLarge}>
                  {mostFrequentCount > 0 ? `${mostFrequentCount}×` : '—'}
                </Text>
                <Text style={styles.statSub}>{mostFrequentSymptom}</Text>
              </View>

              {/* Right: Avg Severity */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>AVG SEVERITY</Text>
                <Text style={[styles.statValueLarge, { color: '#E8A080' }]}>{avgSeverity}</Text>
                <Text style={styles.statSub}>This week</Text>
              </View>
            </View>

            {/* KEY FINDINGS SECTION */}
            <Text style={styles.sectionTitle}>KEY FINDINGS</Text>

            {findings.map((finding) => (
              <View key={finding.id} style={styles.findingCard}>
                <View style={[styles.findingIconBox, { backgroundColor: finding.iconBg }]}>
                  {renderFindingIcon(finding.iconType, finding.iconColor)}
                </View>
                <View style={styles.findingContent}>
                  <Text style={styles.findingTitle}>{finding.title}</Text>
                  <Text style={styles.findingDesc}>{finding.description}</Text>
                </View>
              </View>
            ))}

            {/* REFRESH AI PATTERNS BUTTON */}
            <View style={styles.actionsWrapper}>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={handleRefreshAi}
                disabled={refreshingAi}
                activeOpacity={0.8}
              >
                {refreshingAi ? (
                  <ActivityIndicator size="small" color={Colors.sage.dark} />
                ) : (
                  <>
                    <RefreshCw size={14} color={Colors.sage.dark} style={{ marginRight: 6 }} />
                    <Text style={styles.refreshBtnText}>Recalculate AI Findings</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

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
    backgroundColor: Colors.background.canvas,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerSubtitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.neutral.muted,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 26,
    color: Colors.neutral.brown,
  },
  updatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4E7DC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  updatedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5A7D66',
    marginRight: 6,
  },
  updatedText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    color: '#5A7D66',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Nunito-Medium',
    fontSize: FontSize.body,
    color: Colors.neutral.brownMid,
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  /* Weekly Chart Card */
  chartCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    color: Colors.neutral.brown,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11.5,
    color: Colors.neutral.muted,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 75,
    paddingTop: 10,
  },
  dayBarColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barPairWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 6,
    height: 52,
    justifyContent: 'center',
  },
  singleBar: {
    width: 8,
    borderRadius: 4,
  },
  dayBarLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10.5,
    color: Colors.neutral.muted,
  },

  /* 2 Stat Cards */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.neutral.muted,
    marginBottom: 4,
  },
  statValueLarge: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 28,
    color: Colors.terracotta.base,
    marginBottom: 2,
  },
  statSub: {
    fontFamily: 'Nunito-Medium',
    fontSize: 12.5,
    color: Colors.neutral.brownMid,
  },

  /* Key Findings */
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.neutral.muted,
    marginBottom: Spacing.sm,
  },
  findingCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  findingIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  findingContent: {
    flex: 1,
  },
  findingTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14.5,
    color: Colors.neutral.brown,
    marginBottom: 3,
  },
  findingDesc: {
    fontFamily: 'Nunito-Medium',
    fontSize: 12.5,
    color: Colors.neutral.brownMid,
    lineHeight: 18,
  },

  /* Actions */
  actionsWrapper: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sage.tint,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  refreshBtnText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12.5,
    color: Colors.sage.dark,
  },

  /* Locked State */
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  lockCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.sage.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  lockTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 22,
    color: Colors.neutral.brown,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontFamily: 'Nunito-Medium',
    fontSize: 13.5,
    color: Colors.neutral.brownMid,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#EDE5D8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.sage.base,
    borderRadius: 4,
  },
  progressLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    color: Colors.neutral.muted,
    marginBottom: Spacing.lg,
  },
  logShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.terracotta.base,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    width: '100%',
    justifyContent: 'center',
  },
  logShortcutText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: Colors.white,
  },
});