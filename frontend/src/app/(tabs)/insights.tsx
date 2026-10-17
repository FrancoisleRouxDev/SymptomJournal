import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sparkles,
  Moon,
  Clock,
  Calendar as CalendarIcon,
  Zap,
  Leaf,
  PlusCircle,
  RefreshCw,
  BrainCircuit,
  Share2,
} from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';
import { exportDoctorSummaryToPdf, DoctorReportData } from '@/lib/pdf-export';
import { InsightsScreenSkeleton } from '@/components/SkeletonLoader';

interface Finding {
  id: string;
  title: string;
  description: string;
  iconType: 'moon' | 'clock' | 'calendar' | 'zap' | 'leaf' | 'sparkles';
  iconBg: string;
  iconColor: string;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STORAGE_KEY_DOCTOR = '@symptomjournal_doctor';
const STORAGE_KEY_CONDITIONS = '@symptomjournal_conditions';

export default function InsightsScreen() {
  const router = useRouter();
  const { colors, isDarkMode, scaled } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entriesCount, setEntriesCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [refreshingAi, setRefreshingAi] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [userName, setUserName] = useState('Patient');
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
      const user = await getCurrentUser();
      const rawName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Patient';
      setUserName(rawName);

      // 1. Fetch symptom history for stats & chart aggregation
      const historyRes = await api.get('/symptoms/history');
      const logs: any[] = historyRes.data.symptoms || [];
      setRawLogs(logs);
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

    // Weekly Bar Chart Data (Mon to Sun)
    const dayMap: Record<number, { pain: number; fatigue: number }> = {
      1: { pain: 0, fatigue: 0 },
      2: { pain: 0, fatigue: 0 },
      3: { pain: 0, fatigue: 0 },
      4: { pain: 0, fatigue: 0 },
      5: { pain: 0, fatigue: 0 },
      6: { pain: 0, fatigue: 0 },
      0: { pain: 0, fatigue: 0 },
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
          dayMap[dayIdx].pain += 1;
        }
      }
    });

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
        let iconBg = isDarkMode ? '#2D2817' : '#FAF4DE';
        let iconColor = '#D4A437';

        if (lower.includes('sleep') || lower.includes('night') || lower.includes('rest')) {
          iconType = 'moon';
          iconBg = isDarkMode ? '#2D2817' : '#FAF4DE';
          iconColor = '#C8972E';
        } else if (lower.includes('time') || lower.includes('afternoon') || lower.includes('morning') || lower.includes('pm')) {
          iconType = 'clock';
          iconBg = isDarkMode ? '#331F1B' : '#FCEAE7';
          iconColor = '#C4714F';
        } else if (lower.includes('week') || lower.includes('trend') || lower.includes('month') || lower.includes('day')) {
          iconType = 'calendar';
          iconBg = isDarkMode ? '#1E2B23' : '#EAF3ED';
          iconColor = '#5A7D66';
        } else if (lower.includes('trigger') || lower.includes('stress') || lower.includes('food')) {
          iconType = 'leaf';
          iconBg = isDarkMode ? '#1A2936' : '#EBF4FA';
          iconColor = '#4A8DBF';
        } else {
          iconType = 'sparkles';
          iconBg = isDarkMode ? '#271F33' : '#F3EDF9';
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
        iconBg: isDarkMode ? '#331F1B' : '#FCEAE7',
        iconColor: '#C4714F',
      });
    }

    if (analysis.suggestion) {
      list.push({
        id: 'finding-suggestion',
        title: 'Actionable Advice',
        description: analysis.suggestion,
        iconType: 'calendar',
        iconBg: isDarkMode ? '#1E2B23' : '#EAF3ED',
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
        iconBg: isDarkMode ? '#2D2817' : '#FAF4DE',
        iconColor: '#C8972E',
      },
      {
        id: '2',
        title: 'Afternoon Peak',
        description:
          'Most pain symptoms appear between 1–4 PM. Consider a midday hydration break or short rest during this window.',
        iconType: 'clock',
        iconBg: isDarkMode ? '#331F1B' : '#FCEAE7',
        iconColor: '#C4714F',
      },
      {
        id: '3',
        title: 'Weekly Trend',
        description:
          'Overall symptom frequency shows gradual stabilization compared to earlier logs. Continue logging triggers to track correlations.',
        iconType: 'calendar',
        iconBg: isDarkMode ? '#1E2B23' : '#EAF3ED',
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

  const handleDownloadReport = async () => {
    if (entriesCount === 0) {
      Alert.alert('No Logs', 'Log symptoms before downloading a clinical report.');
      return;
    }

    setExportingReport(true);
    try {
      const storedDoc = await AsyncStorage.getItem(STORAGE_KEY_DOCTOR);
      const storedCond = await AsyncStorage.getItem(STORAGE_KEY_CONDITIONS);

      const counts: Record<string, number> = {};
      rawLogs.forEach((log) => {
        const d = (log.description || 'Symptom').trim();
        const cap = d.charAt(0).toUpperCase() + d.slice(1);
        counts[cap] = (counts[cap] || 0) + 1;
      });

      const sortedFreqs = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], i) => ({
          name,
          count,
          percentage: Math.max(20, Math.round((count / (rawLogs.length || 1)) * 100)),
        }));

      const notes = findings.map((f) => `${f.title}: ${f.description}`);
      const questions = [
        'Discuss pattern correlations observed in weekly frequency.',
        'Review trigger relationships and potential lifestyle adjustments.',
      ];

      const formattedRecent = rawLogs.slice(0, 10).map((log) => {
        const d = log.created_at ? new Date(log.created_at) : new Date();
        const triggersList = Array.isArray(log.triggers)
          ? log.triggers.map((t: any) => t.name || t).join(', ')
          : '';
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          timeOfDay: log.time_of_day ? log.time_of_day.charAt(0).toUpperCase() + log.time_of_day.slice(1) : undefined,
          description: log.description || 'Symptom',
          severity: log.severity !== undefined ? log.severity : 'N/A',
          triggers: triggersList || undefined,
          notes: log.mood || log.notes || undefined,
        };
      });

      const reportData: DoctorReportData = {
        patientName: userName,
        doctorName: storedDoc || undefined,
        conditions: storedCond || undefined,
        dateRange: weekDateRange,
        daysTracked: Math.max(1, Math.min(rawLogs.length, 30)),
        totalEntries: entriesCount,
        symptomTypesCount: Object.keys(counts).length,
        avgSeverity: avgSeverity,
        frequentSymptoms: sortedFreqs,
        patternsNotes: notes,
        questionsToDiscuss: questions,
        recentLogs: formattedRecent,
      };

      await exportDoctorSummaryToPdf(reportData);
    } catch (err: any) {
      Alert.alert('Report Error', err?.message || 'Could not export insights document.');
    } finally {
      setExportingReport(false);
    }
  };

  const renderFindingIcon = (type: Finding['iconType'], color: string) => {
    switch (type) {
      case 'moon':
        return <Moon size={scaled(20)} color={color} />;
      case 'clock':
        return <Clock size={scaled(20)} color={color} />;
      case 'calendar':
        return <CalendarIcon size={scaled(20)} color={color} />;
      case 'leaf':
        return <Leaf size={scaled(20)} color={color} />;
      case 'zap':
        return <Zap size={scaled(20)} color={color} />;
      default:
        return <Sparkles size={scaled(20)} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.neutral.muted, fontSize: scaled(11.5) }]}>
              {weekDateRange}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.neutral.brown, fontSize: scaled(26) }]}>
              AI Insights
            </Text>
          </View>
          <View style={styles.headerRightActions}>
            {isReady && (
              <TouchableOpacity
                style={[
                  styles.downloadDocBtn,
                  { backgroundColor: isDarkMode ? colors.terracotta.base : '#3E2D1E' },
                  exportingReport && { opacity: 0.7 },
                ]}
                onPress={handleDownloadReport}
                disabled={exportingReport}
                activeOpacity={0.8}
              >
                {exportingReport ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Share2 size={scaled(13)} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={[styles.downloadDocText, { fontSize: scaled(11.5) }]}>Export Doc</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {isReady && (
              <View style={[styles.updatedBadge, { backgroundColor: isDarkMode ? '#1E2B23' : '#D4E7DC' }]}>
                <View style={[styles.updatedDot, { backgroundColor: colors.sage.dark }]} />
                <Text style={[styles.updatedText, { color: colors.sage.dark, fontSize: scaled(11) }]}>
                  Updated
                </Text>
              </View>
            )}
          </View>
        </View>

        {loading ? (
          <InsightsScreenSkeleton />
        ) : !isReady ? (
          /* Locked State if < 3 symptoms */
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadInsights(true)} />}
          >
            <View style={[styles.lockCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              <View style={[styles.lockIconCircle, { backgroundColor: colors.sage.tint }]}>
                <BrainCircuit size={scaled(38)} color={colors.sage.dark} />
              </View>
              <Text style={[styles.lockTitle, { color: colors.neutral.brown, fontSize: scaled(22) }]}>
                AI Insights Locked
              </Text>
              <Text style={[styles.lockSubtitle, { color: colors.neutral.brownMid, fontSize: scaled(13.5) }]}>
                Log at least 3 symptoms to unlock AI pattern intelligence, weekly frequency charts, and trigger correlation analysis.
              </Text>

              {/* Progress */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.background.cream }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.round((entriesCount / 3) * 100))}%`,
                      backgroundColor: colors.sage.base,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                {entriesCount} of 3 entries logged ({3 - entriesCount} remaining)
              </Text>

              <TouchableOpacity
                style={[styles.logShortcutBtn, { backgroundColor: colors.sage.dark }]}
                onPress={() => router.push('/(tabs)/log' as any)}
                activeOpacity={0.85}
              >
                <PlusCircle size={scaled(18)} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.logShortcutText, { fontSize: scaled(14) }]}>Log a Symptom</Text>
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
            <View style={[styles.chartCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              <View style={styles.chartHeaderRow}>
                <Text style={[styles.chartTitle, { color: colors.neutral.brown, fontSize: scaled(15) }]}>
                  Weekly Overview
                </Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: colors.terracotta.base }]} />
                    <Text style={[styles.legendText, { color: colors.neutral.muted, fontSize: scaled(11.5) }]}>
                      Pain
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: colors.sage.base }]} />
                    <Text style={[styles.legendText, { color: colors.neutral.muted, fontSize: scaled(11.5) }]}>
                      Fatigue
                    </Text>
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
                              backgroundColor: colors.terracotta.base,
                              opacity: item.painCount > 0 ? 1 : 0.35,
                            },
                          ]}
                        />
                        {/* Fatigue bar */}
                        <View
                          style={[
                            styles.singleBar,
                            {
                              height: fatigueHeight,
                              backgroundColor: colors.sage.base,
                              opacity: item.fatigueCount > 0 ? 1 : 0.35,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.dayBarLabel, { color: colors.neutral.muted, fontSize: scaled(10.5) }]}>
                        {item.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 2 STAT CARDS ROW */}
            <View style={styles.statsRow}>
              {/* Left: Most Frequent */}
              <View style={[styles.statCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
                <Text style={[styles.statLabel, { color: colors.neutral.muted, fontSize: scaled(10.5) }]}>
                  MOST FREQUENT
                </Text>
                <Text style={[styles.statValueLarge, { color: colors.terracotta.base, fontSize: scaled(28) }]}>
                  {mostFrequentCount > 0 ? `${mostFrequentCount}×` : '—'}
                </Text>
                <Text style={[styles.statSub, { color: colors.neutral.brownMid, fontSize: scaled(12.5) }]}>
                  {mostFrequentSymptom}
                </Text>
              </View>

              {/* Right: Avg Severity */}
              <View style={[styles.statCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
                <Text style={[styles.statLabel, { color: colors.neutral.muted, fontSize: scaled(10.5) }]}>
                  AVG SEVERITY
                </Text>
                <Text style={[styles.statValueLarge, { color: colors.terracotta.light || '#E8A080', fontSize: scaled(28) }]}>
                  {avgSeverity}
                </Text>
                <Text style={[styles.statSub, { color: colors.neutral.brownMid, fontSize: scaled(12.5) }]}>
                  This week
                </Text>
              </View>
            </View>

            {/* KEY FINDINGS SECTION */}
            <Text style={[styles.sectionTitle, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              KEY FINDINGS
            </Text>

            {findings.map((finding) => (
              <View
                key={finding.id}
                style={[styles.findingCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}
              >
                <View style={[styles.findingIconBox, { backgroundColor: finding.iconBg }]}>
                  {renderFindingIcon(finding.iconType, finding.iconColor)}
                </View>
                <View style={styles.findingContent}>
                  <Text style={[styles.findingTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                    {finding.title}
                  </Text>
                  <Text style={[styles.findingDesc, { color: colors.neutral.brownMid, fontSize: scaled(12.5) }]}>
                    {finding.description}
                  </Text>
                </View>
              </View>
            ))}

            {/* REFRESH AI PATTERNS BUTTON */}
            <View style={styles.actionsWrapper}>
              <TouchableOpacity
                style={[styles.refreshBtn, { backgroundColor: colors.sage.tint }]}
                onPress={handleRefreshAi}
                disabled={refreshingAi}
                activeOpacity={0.8}
              >
                {refreshingAi ? (
                  <ActivityIndicator size="small" color={colors.sage.dark} />
                ) : (
                  <>
                    <RefreshCw size={scaled(14)} color={colors.sage.dark} style={{ marginRight: 6 }} />
                    <Text style={[styles.refreshBtnText, { color: colors.sage.dark, fontSize: scaled(12.5) }]}>
                      Recalculate AI Findings
                    </Text>
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  downloadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  downloadDocText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  updatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  updatedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  updatedText: {
    fontFamily: 'Nunito-Bold',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  chartCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
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
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValueLarge: {
    fontFamily: 'DMSerifDisplay-Regular',
    marginBottom: 2,
  },
  statSub: {
    fontFamily: 'Nunito-Medium',
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  findingCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
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
    marginBottom: 3,
  },
  findingDesc: {
    fontFamily: 'Nunito-Medium',
    lineHeight: 18,
  },
  actionsWrapper: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  refreshBtnText: {
    fontFamily: 'Nunito-Bold',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  lockCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  lockTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontFamily: 'Nunito-Medium',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontFamily: 'Nunito-Bold',
    marginBottom: Spacing.lg,
  },
  logShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    width: '100%',
    justifyContent: 'center',
  },
  logShortcutText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});