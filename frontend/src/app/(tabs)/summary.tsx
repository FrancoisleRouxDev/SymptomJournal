import React, { useEffect, useState, useCallback } from 'react';
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
import { Share2, Sparkles, RefreshCw, FileText, AlertCircle, PlusCircle } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';
import { exportDoctorSummaryToPdf, DoctorReportData } from '@/lib/pdf-export';
import { SummaryScreenSkeleton } from '@/components/SkeletonLoader';

interface SymptomFreq {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const SYMPTOM_BAR_COLORS = ['#C4714F', '#7B9E87', '#E8B87A', '#B8A0D0', '#7AAED0', '#E8A0A0'];

export default function DoctorSummaryScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const [userName, setUserName] = useState('Patient');
  const [symptomLogs, setSymptomLogs] = useState<any[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [symptomTypesCount, setSymptomTypesCount] = useState(0);
  const [avgSeverity, setAvgSeverity] = useState<string | number>('0.0');
  const [dateRangeText, setDateRangeText] = useState('No entries yet');
  const [daysTracked, setDaysTracked] = useState(0);
  const [frequentSymptoms, setFrequentSymptoms] = useState<SymptomFreq[]>([]);

  const [aiSummary, setAiSummary] = useState<string>('');
  const [patternsNotes, setPatternsNotes] = useState<string[]>([]);
  const [questionsToDiscuss, setQuestionsToDiscuss] = useState<string[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Get user profile
      const user = await getCurrentUser();
      const rawName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Patient';
      setUserName(rawName);

      // 2. Fetch history
      const historyRes = await api.get('/symptoms/history');
      const logs: any[] = historyRes.data.symptoms || [];
      setSymptomLogs(logs);
      setTotalEntries(logs.length);

      if (logs.length > 0) {
        // Compute unique types and frequencies
        const counts: Record<string, number> = {};
        let totalSev = 0;
        let validSevCount = 0;

        logs.forEach((log) => {
          const desc = (log.description || 'General Symptom').trim();
          const capDesc = desc.charAt(0).toUpperCase() + desc.slice(1);
          counts[capDesc] = (counts[capDesc] || 0) + 1;

          if (log.severity !== undefined && log.severity !== null) {
            totalSev += Number(log.severity);
            validSevCount++;
          }
        });

        const uniqueKeys = Object.keys(counts);
        setSymptomTypesCount(uniqueKeys.length);

        const computedAvg = validSevCount > 0 ? (totalSev / validSevCount).toFixed(1) : 'N/A';
        setAvgSeverity(computedAvg);

        // Sort symptoms by frequency
        const sortedFreqs = uniqueKeys
          .map((name) => ({ name, count: counts[name] }))
          .sort((a, b) => b.count - a.count);

        const maxCount = sortedFreqs[0]?.count || 1;
        const formattedFreqs: SymptomFreq[] = sortedFreqs.slice(0, 5).map((item, index) => ({
          name: item.name,
          count: item.count,
          percentage: Math.max(15, Math.round((item.count / maxCount) * 100)),
          color: SYMPTOM_BAR_COLORS[index % SYMPTOM_BAR_COLORS.length],
        }));
        setFrequentSymptoms(formattedFreqs);

        // Date range calculation
        const dates = logs
          .map((l) => (l.created_at ? new Date(l.created_at).getTime() : 0))
          .filter((d) => d > 0)
          .sort((a, b) => a - b);

        if (dates.length > 0) {
          const earliest = new Date(dates[0]);
          const latest = new Date(dates[dates.length - 1]);
          const daySpan = Math.max(
            1,
            Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24))
          );
          setDaysTracked(daySpan);

          const fmtEarliest = earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const fmtLatest = latest.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          setDateRangeText(`${fmtEarliest} – ${fmtLatest}`);
        }

        // 3. If >= 3 logs, load / generate patterns and summary
        if (logs.length >= 3) {
          await fetchAiPatternsAndSummary();
        }
      }
    } catch (err: any) {
      console.log('Error loading doctor summary data:', err);
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


  const fetchAiPatternsAndSummary = async () => {
    try {
      // First try fetching patterns to populate Patterns & Notes
      const patternRes = await api.get('/analysis/patterns');
      if (patternRes.data?.ready && patternRes.data?.analysis) {
        const ana = patternRes.data.analysis;
        const notes: string[] = [];

        if (ana.time_pattern && ana.time_pattern !== 'Not enough data') {
          notes.push(`Time distribution: ${ana.time_pattern}`);
        }

        if (Array.isArray(ana.key_findings)) {
          ana.key_findings.forEach((f: any) => {
            if (f.title && f.description) {
              notes.push(`${f.title}: ${f.description}`);
            } else if (typeof f === 'string') {
              notes.push(f);
            }
          });
        }

        if (notes.length === 0) {
          notes.push('Symptoms are being monitored for recurrence and trigger links.');
        }
        setPatternsNotes(notes);

        if (ana.suggestion) {
          setQuestionsToDiscuss([ana.suggestion]);
        }
      }

      // Generate or fetch Doctor Summary text
      const summaryRes = await api.post('/analysis/summary');
      if (summaryRes.data?.summary) {
        setAiSummary(summaryRes.data.summary);
        parseSummarySections(summaryRes.data.summary);
      }
    } catch (err: any) {
      console.log('AI analysis not ready or rate-limited:', err?.message || err);
      // Fallback local patterns if AI rate-limited
      populateFallbackNotes();
    }
  };

  const populateFallbackNotes = () => {
    setPatternsNotes([
      'Symptom frequency clusters around recorded times of day.',
      'Correlations between logged triggers and severity are actively tracked.',
      'Symptom-free intervals are monitored between active flare-ups.',
    ]);
    setQuestionsToDiscuss([
      'Discuss possible environmental or dietary triggers with your doctor.',
      'Review whether medication timing coincides with peak symptom hours.',
    ]);
  };

  const parseSummarySections = (text: string) => {
    if (!text) return;

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedNotes: string[] = [];
    const parsedQuestions: string[] = [];

    let currentSection = '';

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('patterns') || lower.includes('notes')) {
        currentSection = 'notes';
        continue;
      } else if (lower.includes('questions') || lower.includes('discuss')) {
        currentSection = 'questions';
        continue;
      } else if (lower.includes('patient report') || lower.includes('overview') || lower.includes('most frequent')) {
        currentSection = 'other';
        continue;
      }

      if (currentSection === 'notes' && line.startsWith('-')) {
        parsedNotes.push(line.replace(/^[-*•]\s*/, ''));
      } else if (currentSection === 'questions' && (line.startsWith('-') || /^\d+\./.test(line))) {
        parsedQuestions.push(line.replace(/^[-*•\d.]\s*/, ''));
      }
    }

    if (parsedNotes.length > 0) setPatternsNotes(parsedNotes);
    if (parsedQuestions.length > 0) setQuestionsToDiscuss(parsedQuestions);
  };

  const handleRegenerateSummary = async () => {
    if (totalEntries < 3) {
      Alert.alert('More Data Needed', 'Please log at least 3 symptoms before generating an AI summary.');
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await api.post('/analysis/summary');
      if (res.data?.summary) {
        setAiSummary(res.data.summary);
        parseSummarySections(res.data.summary);
        Alert.alert('Summary Updated', 'Your doctor summary has been refreshed with the latest data.');
      }
    } catch (err: any) {
      Alert.alert(
        'Notice',
        err.response?.data?.detail || 'Summary generation is currently updating. Please try again shortly.'
      );
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleExportPdf = async () => {
    if (totalEntries === 0) {
      Alert.alert('No Logs', 'Please log symptoms before generating a PDF report.');
      return;
    }

    setExportingPdf(true);
    try {
      const reportData: DoctorReportData = {
        patientName: userName,
        dateRange: dateRangeText,
        daysTracked,
        totalEntries,
        symptomTypesCount,
        avgSeverity,
        frequentSymptoms,
        patternsNotes,
        questionsToDiscuss,
        fullSummaryText: aiSummary,
      };

      await exportDoctorSummaryToPdf(reportData);
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export PDF at this time.');
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Doctor Summary</Text>
          <TouchableOpacity
            style={[styles.exportButton, exportingPdf && styles.exportButtonDisabled]}
            onPress={handleExportPdf}
            disabled={exportingPdf || loading}
            activeOpacity={0.8}
          >
            {exportingPdf ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Share2 size={15} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <SummaryScreenSkeleton />
        ) : totalEntries < 3 ? (
          /* Empty / Insufficient State */
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          >
            <View style={styles.lockCard}>
              <View style={styles.lockIconContainer}>
                <FileText size={36} color={Colors.terracotta.base} />
              </View>
              <Text style={styles.lockTitle}>Clinical Report Locked</Text>
              <Text style={styles.lockSubtitle}>
                Log at least 3 symptoms to generate a comprehensive, clinic-ready Doctor Summary with
                frequency breakdowns and pattern analysis.
              </Text>

              {/* Progress */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.round((totalEntries / 3) * 100))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {totalEntries} of 3 entries logged ({3 - totalEntries} remaining)
              </Text>

              <TouchableOpacity
                style={styles.logShortcutBtn}
                onPress={() => router.push('/(tabs)/log' as any)}
                activeOpacity={0.8}
              >
                <PlusCircle size={18} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.logShortcutText}>Log a Symptom Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Full Clinical Report View */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          >
            {/* Top Dark Patient Report Card */}
            <View style={styles.patientCard}>
              <Text style={styles.patientLabel}>PATIENT REPORT</Text>
              <Text style={styles.patientName}>{userName}</Text>
              <Text style={styles.patientMeta}>
                {dateRangeText} · {daysTracked} {daysTracked === 1 ? 'day' : 'days'} tracked
              </Text>

              {/* 3 Metric Grid */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{totalEntries}</Text>
                  <Text style={styles.statTitle}>ENTRIES LOGGED</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{symptomTypesCount}</Text>
                  <Text style={styles.statTitle}>SYMPTOM TYPES</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{avgSeverity}</Text>
                  <Text style={styles.statTitle}>AVG SEVERITY</Text>
                </View>
              </View>
            </View>

            {/* Most Frequent Symptoms Card */}
            <View style={styles.card}>
              <Text style={styles.cardSectionHeader}>MOST FREQUENT SYMPTOMS</Text>
              {frequentSymptoms.length === 0 ? (
                <Text style={styles.emptyNote}>No symptom data to display.</Text>
              ) : (
                frequentSymptoms.map((item, index) => (
                  <View key={index} style={styles.symptomRow}>
                    <View style={styles.symptomRowHeader}>
                      <Text style={styles.symptomName}>{item.name}</Text>
                      <Text style={styles.symptomCount}>{item.count}×</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Patterns & Notes Card */}
            <View style={styles.card}>
              <Text style={styles.cardSectionHeader}>PATTERNS &amp; NOTES</Text>
              {patternsNotes.length === 0 ? (
                <Text style={styles.emptyNote}>Analyzing patterns from your logs...</Text>
              ) : (
                patternsNotes.map((note, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{note.replace(/^[-*•]\s*/, '')}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Questions to Discuss Card */}
            {questionsToDiscuss.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardSectionHeader}>QUESTIONS TO DISCUSS WITH DOCTOR</Text>
                {questionsToDiscuss.map((question, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: Colors.terracotta.base }]} />
                    <Text style={styles.bulletText}>{question.replace(/^[-*•\d.]\s*/, '')}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Regenerate AI Summary Card Action */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.regenerateBtn}
                onPress={handleRegenerateSummary}
                disabled={generatingAi}
                activeOpacity={0.8}
              >
                {generatingAi ? (
                  <ActivityIndicator size="small" color={Colors.sage.dark} />
                ) : (
                  <>
                    <RefreshCw size={15} color={Colors.sage.dark} style={{ marginRight: 6 }} />
                    <Text style={styles.regenerateBtnText}>Refresh Clinical Insights</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Medical Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <AlertCircle size={14} color={Colors.neutral.muted} style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={styles.disclaimerText}>
                This report is compiled to facilitate your doctor's clinical review. It does not replace
                professional medical advice or clinical diagnoses.
              </Text>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 26,
    color: Colors.neutral.brown,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E2D1E',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.white,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
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
  /* Top Dark Patient Card */
  patientCard: {
    backgroundColor: '#3E2D1E',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  patientLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    color: '#D4E7DC',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  patientName: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 24,
    color: Colors.white,
    marginBottom: 4,
  },
  patientMeta: {
    fontFamily: 'Nunito-Medium',
    fontSize: 13,
    color: '#D8CFC4',
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statNumber: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: Colors.white,
  },
  statTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 9.5,
    color: '#D8CFC4',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  /* Section Cards */
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DC',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardSectionHeader: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11.5,
    color: Colors.neutral.muted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  /* Symptom Bar Rows */
  symptomRow: {
    marginBottom: Spacing.md,
  },
  symptomRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  symptomName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: Colors.neutral.brown,
  },
  symptomCount: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.neutral.brownMid,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#EDE5D8',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  /* Bullet Rows */
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sage.base,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Nunito-Medium',
    fontSize: 13.5,
    color: Colors.neutral.brown,
    lineHeight: 19,
  },
  emptyNote: {
    fontFamily: 'Nunito-Medium',
    fontSize: 13,
    color: Colors.neutral.muted,
  },
  /* Action Buttons */
  actionsContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sage.tint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  regenerateBtnText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.sage.dark,
  },
  /* Disclaimer */
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3ECE2',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'Nunito-Medium',
    fontSize: 11.5,
    color: Colors.neutral.brownMid,
    lineHeight: 16,
  },
  /* Empty State / Lock Screen */
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
  lockIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.terracotta.tint,
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
    backgroundColor: Colors.terracotta.base,
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