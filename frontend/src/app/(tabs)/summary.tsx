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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share2, RefreshCw, FileText, AlertCircle, PlusCircle, UserCheck } from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';
import { parseTimestamp } from '@/lib/dates';
import { exportDoctorSummaryToPdf, DoctorReportData } from '@/lib/pdf-export';
import { SummaryScreenSkeleton } from '@/components/SkeletonLoader';
import { fetchCommonConditions } from '@/lib/conditions';

interface SymptomFreq {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const SYMPTOM_BAR_COLORS = ['#C4714F', '#7B9E87', '#E8B87A', '#B8A0D0', '#7AAED0', '#E8A0A0'];
const STORAGE_KEY_DOCTOR = '@symptomjournal_doctor';
const STORAGE_KEY_CONDITIONS = '@symptomjournal_conditions';

export default function DoctorSummaryScreen() {
  const router = useRouter();
  const { colors, isDarkMode, scaled } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const [userName, setUserName] = useState('Patient');
  const [doctorName, setDoctorName] = useState('');
  const [conditions, setConditions] = useState('');
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
      // 1. Get user profile and stored doctor / conditions (optional)
      const user = await getCurrentUser();
      const rawName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Patient';
      setUserName(rawName);

      const storedDoc = await AsyncStorage.getItem(STORAGE_KEY_DOCTOR);
      if (storedDoc && storedDoc !== 'Not set') {
        setDoctorName(storedDoc);
      } else if (user?.user_metadata?.doctor) {
        setDoctorName(user.user_metadata.doctor);
      } else {
        setDoctorName('');
      }

      // Fetch conditions from Supabase common_conditions table
      try {
        const condList = await fetchCommonConditions();
        if (condList && condList.length > 0) {
          setConditions(condList.join(', '));
        } else {
          const storedCond = await AsyncStorage.getItem(STORAGE_KEY_CONDITIONS);
          if (storedCond && storedCond !== 'Not set') {
            setConditions(storedCond);
          } else if (user?.user_metadata?.conditions) {
            setConditions(user.user_metadata.conditions);
          } else {
            setConditions('');
          }
        }
      } catch {
        setConditions('');
      }

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
          const desc = (log.description || 'General Symptom').replace(/\$/g, '').trim();
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
          .map((l) => (l.created_at ? parseTimestamp(l.created_at).getTime() : 0))
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
      // Map recent logs for clean printable table
      const formattedRecent = symptomLogs.slice(0, 10).map((log) => {
        const d = log.created_at ? parseTimestamp(log.created_at) : new Date();
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
        doctorName: doctorName,
        conditions: conditions,
        dateRange: dateRangeText,
        daysTracked,
        totalEntries,
        symptomTypesCount,
        avgSeverity,
        frequentSymptoms,
        patternsNotes,
        questionsToDiscuss,
        fullSummaryText: aiSummary,
        recentLogs: formattedRecent,
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
    <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.neutral.brown, fontSize: scaled(26) }]}>
            Doctor Summary
          </Text>
          <TouchableOpacity
            style={[
              styles.exportButton,
              { backgroundColor: isDarkMode ? colors.terracotta.base : '#3E2D1E' },
              exportingPdf && styles.exportButtonDisabled,
            ]}
            onPress={handleExportPdf}
            disabled={exportingPdf || loading}
            activeOpacity={0.8}
          >
            {exportingPdf ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Share2 size={scaled(15)} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.exportButtonText, { fontSize: scaled(13) }]}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <SummaryScreenSkeleton />
        ) : totalEntries < 3 ? (
          /* Locked State */
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          >
            <View style={[styles.lockCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              <View style={[styles.lockIconContainer, { backgroundColor: colors.terracotta.tint }]}>
                <FileText size={scaled(36)} color={colors.terracotta.base} />
              </View>
              <Text style={[styles.lockTitle, { color: colors.neutral.brown, fontSize: scaled(22) }]}>
                Clinical Report Locked
              </Text>
              <Text style={[styles.lockSubtitle, { color: colors.neutral.brownMid, fontSize: scaled(13.5) }]}>
                Log at least 3 symptoms to generate a comprehensive, clinic-ready Doctor Summary with frequency breakdowns and pattern analysis.
              </Text>

              {/* Progress */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.background.cream }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.round((totalEntries / 3) * 100))}%`,
                      backgroundColor: colors.terracotta.base,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                {totalEntries} of 3 entries logged ({3 - totalEntries} remaining)
              </Text>

              <TouchableOpacity
                style={[styles.logShortcutBtn, { backgroundColor: colors.terracotta.base }]}
                onPress={() => router.push('/(tabs)/log' as any)}
                activeOpacity={0.8}
              >
                <PlusCircle size={scaled(18)} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.logShortcutText, { fontSize: scaled(14) }]}>Log a Symptom Now</Text>
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
            {/* Top Patient Report Card */}
            <View style={[styles.patientCard, { backgroundColor: isDarkMode ? '#241E1A' : '#3E2D1E', borderColor: colors.neutral.border }]}>
              <View style={styles.patientCardHeaderRow}>
                <View>
                  <Text style={[styles.patientLabel, { fontSize: scaled(11) }]}>PATIENT REPORT</Text>
                  <Text style={[styles.patientName, { fontSize: scaled(24) }]}>{userName}</Text>
                  <Text style={[styles.patientMeta, { fontSize: scaled(13) }]}>
                    {dateRangeText} · {daysTracked} {daysTracked === 1 ? 'day' : 'days'} tracked
                  </Text>
                </View>
              </View>

              {/* Doctor / Condition Tag */}
              <View style={styles.doctorInfoRow}>
                <UserCheck size={scaled(13)} color="#A8C4B0" style={{ marginRight: 5 }} />
                <Text style={[styles.doctorInfoText, { fontSize: scaled(12) }]}>
                  {doctorName} · {conditions}
                </Text>
              </View>

              {/* 3 Metric Grid */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { fontSize: scaled(20) }]}>{totalEntries}</Text>
                  <Text style={[styles.statTitle, { fontSize: scaled(9.5) }]}>ENTRIES LOGGED</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { fontSize: scaled(20) }]}>{symptomTypesCount}</Text>
                  <Text style={[styles.statTitle, { fontSize: scaled(9.5) }]}>SYMPTOM TYPES</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { fontSize: scaled(20) }]}>{avgSeverity}</Text>
                  <Text style={[styles.statTitle, { fontSize: scaled(9.5) }]}>AVG SEVERITY</Text>
                </View>
              </View>
            </View>

            {/* Most Frequent Symptoms Card */}
            <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              <Text style={[styles.cardSectionHeader, { color: colors.neutral.muted, fontSize: scaled(11.5) }]}>
                MOST FREQUENT SYMPTOMS
              </Text>
              {frequentSymptoms.length === 0 ? (
                <Text style={[styles.emptyNote, { color: colors.neutral.muted, fontSize: scaled(13) }]}>
                  No symptom data to display.
                </Text>
              ) : (
                frequentSymptoms.map((item, index) => (
                  <View key={index} style={styles.symptomRow}>
                    <View style={styles.symptomRowHeader}>
                      <Text style={[styles.symptomName, { color: colors.neutral.brown, fontSize: scaled(14) }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.symptomCount, { color: colors.neutral.brownMid, fontSize: scaled(13) }]}>
                        {item.count}×
                      </Text>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: colors.background.cream }]}>
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
            <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              <Text style={[styles.cardSectionHeader, { color: colors.neutral.muted, fontSize: scaled(11.5) }]}>
                PATTERNS &amp; NOTES
              </Text>
              {patternsNotes.length === 0 ? (
                <Text style={[styles.emptyNote, { color: colors.neutral.muted, fontSize: scaled(13) }]}>
                  Analyzing patterns from your logs...
                </Text>
              ) : (
                patternsNotes.map((note, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.sage.base }]} />
                    <Text style={[styles.bulletText, { color: colors.neutral.brown, fontSize: scaled(13.5) }]}>
                      {note.replace(/^[-*•]\s*/, '')}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Questions to Discuss Card */}
            {questionsToDiscuss.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
                <Text style={[styles.cardSectionHeader, { color: colors.neutral.muted, fontSize: scaled(11.5) }]}>
                  QUESTIONS TO DISCUSS WITH DOCTOR
                </Text>
                {questionsToDiscuss.map((question, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.terracotta.base }]} />
                    <Text style={[styles.bulletText, { color: colors.neutral.brown, fontSize: scaled(13.5) }]}>
                      {question.replace(/^[-*•\d.]\s*/, '')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Regenerate AI Summary Card Action */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.regenerateBtn, { backgroundColor: colors.sage.tint }]}
                onPress={handleRegenerateSummary}
                disabled={generatingAi}
                activeOpacity={0.8}
              >
                {generatingAi ? (
                  <ActivityIndicator size="small" color={colors.sage.dark} />
                ) : (
                  <>
                    <RefreshCw size={scaled(15)} color={colors.sage.dark} style={{ marginRight: 6 }} />
                    <Text style={[styles.regenerateBtnText, { color: colors.sage.dark, fontSize: scaled(13) }]}>
                      Refresh Clinical Insights
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Medical Disclaimer */}
            <View style={[styles.disclaimerContainer, { backgroundColor: isDarkMode ? '#1E1A17' : '#F3ECE2' }]}>
              <AlertCircle size={scaled(14)} color={colors.neutral.muted} style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={[styles.disclaimerText, { color: colors.neutral.brownMid, fontSize: scaled(11.5) }]}>
                This report is compiled to facilitate your doctor's clinical review. It does not replace professional medical advice or clinical diagnoses.
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
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportButtonText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  /* Patient Card */
  patientCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  patientCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientLabel: {
    fontFamily: 'Nunito-Bold',
    color: '#D4E7DC',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  patientName: {
    fontFamily: 'DMSerifDisplay-Regular',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  patientMeta: {
    fontFamily: 'Nunito-Medium',
    color: '#D8CFC4',
    marginBottom: 8,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  doctorInfoText: {
    fontFamily: 'Nunito-Bold',
    color: '#A8C4B0',
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
    color: '#FFFFFF',
  },
  statTitle: {
    fontFamily: 'Nunito-Bold',
    color: '#D8CFC4',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  /* Section Cards */
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardSectionHeader: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
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
  },
  symptomCount: {
    fontFamily: 'Nunito-Bold',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Nunito-Medium',
    lineHeight: 19,
  },
  emptyNote: {
    fontFamily: 'Nunito-Medium',
  },
  actionsContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  regenerateBtnText: {
    fontFamily: 'Nunito-Bold',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'Nunito-Medium',
    lineHeight: 16,
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
  lockIconContainer: {
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