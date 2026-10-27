import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Trash2, FileText } from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import api from '@/lib/api';
import { parseTimestamp, timestampDateKey, toLocalDateKey } from '@/lib/dates';
import { TimelineScreenSkeleton } from '@/components/SkeletonLoader';

const CATEGORY_FILTERS = ['All', 'Pain', 'Fatigue', 'Mood', 'Digestion', 'Breathing', 'Skin'];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function TimelineScreen() {
  const router = useRouter();
  const { colors, isDarkMode, scaled } = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const categoryBadgeStyles = useMemo(() => {
    if (isDarkMode) {
      return {
        Pain: { bg: '#3D251C', text: '#E28E6E' },
        Fatigue: { bg: '#223328', text: '#A8C4B0' },
        Mood: { bg: '#2A1F36', text: '#C4A8E0' },
        Digestion: { bg: '#362A19', text: '#E8B87A' },
        Breathing: { bg: '#1A2936', text: '#7AAED0' },
        Skin: { bg: '#361E1E', text: '#E8A0A0' },
        General: { bg: '#2E2822', text: '#D6CBC2' },
      };
    }
    return {
      Pain: { bg: '#F5D8CC', text: '#C4714F' },
      Fatigue: { bg: '#D4E7DC', text: '#5A7D66' },
      Mood: { bg: '#EDE4F5', text: '#8A68B0' },
      Digestion: { bg: '#FBF0DE', text: '#B88232' },
      Breathing: { bg: '#DFEFFB', text: '#4585B5' },
      Skin: { bg: '#FCE7E7', text: '#C76363' },
      General: { bg: '#EDE5D8', text: '#6A5A4E' },
    };
  }, [isDarkMode]);

  const categoryDotColors = useMemo(() => ({
    Pain: colors.terracotta.base,
    Fatigue: colors.sage.base,
    Mood: '#B8A0D0',
    Digestion: '#E8B87A',
    Breathing: '#7AAED0',
    Skin: '#E8A0A0',
    General: colors.neutral.muted,
  }), [colors]);

  const loadSymptoms = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/symptoms/history');
      const logs = res.data?.symptoms || [];
      setSymptoms(logs);
    } catch (err: any) {
      console.log('Error fetching symptom timeline:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSymptoms();
    }, [loadSymptoms])
  );

  const handleDeleteLog = (logId: string, description: string) => {
    Alert.alert(
      'Delete Symptom Log',
      `Are you sure you want to remove the entry "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/symptoms/history/${logId}`);
              loadSymptoms(true);
            } catch (err: any) {
              Alert.alert('Delete Failed', err.response?.data?.detail || 'Could not delete entry.');
            }
          },
        },
      ]
    );
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const loggedDatesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    symptoms.forEach((s) => {
      if (s.created_at) {
        const dKey = timestampDateKey(s.created_at);
        map[dKey] = true;
      }
    });
    return map;
  }, [symptoms]);

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

    if (selectedDateKey === dateKey) {
      setSelectedDateKey(null);
    } else {
      setSelectedDateKey(dateKey);
    }
  };

  const getCategoriesFromDesc = (desc: string): string[] => {
    const lower = (desc || '').toLowerCase();
    const found: string[] = [];
    if (lower.includes('pain') || lower.includes('headache') || lower.includes('cramp')) found.push('Pain');
    if (lower.includes('fatigue') || lower.includes('energy') || lower.includes('tired')) found.push('Fatigue');
    if (lower.includes('mood') || lower.includes('anxiety') || lower.includes('depress') || lower.includes('stress')) found.push('Mood');
    if (lower.includes('digest') || lower.includes('stomach') || lower.includes('nausea') || lower.includes('bloat')) found.push('Digestion');
    if (lower.includes('breath') || lower.includes('cough') || lower.includes('chest')) found.push('Breathing');
    if (lower.includes('skin') || lower.includes('rash') || lower.includes('itch')) found.push('Skin');
    return found.length > 0 ? found : ['General'];
  };

  const filteredAndGroupedSymptoms = useMemo(() => {
    let list = symptoms;
    if (selectedCategory !== 'All') {
      list = list.filter((s) => getCategoriesFromDesc(s.description).includes(selectedCategory));
    }

    if (selectedDateKey) {
      list = list.filter((s) => s.created_at && timestampDateKey(s.created_at) === selectedDateKey);
    }

    const groups: Record<string, any[]> = {};
    const todayStr = toLocalDateKey(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateKey(yesterday);

    list.forEach((s) => {
      const dateStr = s.created_at ? timestampDateKey(s.created_at) : 'Unknown Date';
      let title = dateStr;

      if (dateStr === todayStr) {
        const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        title = `TODAY — ${formattedDate}`;
      } else if (dateStr === yesterdayStr) {
        const formattedDate = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        title = `YESTERDAY — ${formattedDate}`;
      } else if (s.created_at) {
        const d = parseTimestamp(s.created_at);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        title = `${dayName} — ${formattedDate}`;
      }

      if (!groups[title]) groups[title] = [];
      groups[title].push(s);
    });

    return groups;
  }, [symptoms, selectedCategory, selectedDateKey]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.neutral.brown, fontSize: scaled(26) }]}>
            Symptom Timeline
          </Text>
        </View>

        {loading ? (
          <TimelineScreenSkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSymptoms(true)} />}
          >
            {/* Calendar Card */}
            <View style={[styles.calendarCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
              {/* Calendar Month Header */}
              <View style={styles.calendarHeader}>
                <Text style={[styles.calendarMonthText, { color: colors.neutral.brown, fontSize: scaled(15) }]}>
                  {monthName} {year}
                </Text>
                <View style={styles.calendarNav}>
                  <TouchableOpacity
                    style={[styles.calNavBtn, { backgroundColor: isDarkMode ? '#332D28' : '#F3EDE4' }]}
                    onPress={handlePrevMonth}
                  >
                    <ChevronLeft size={scaled(16)} color={colors.neutral.brown} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calNavBtn, { backgroundColor: isDarkMode ? '#332D28' : '#F3EDE4' }]}
                    onPress={handleNextMonth}
                  >
                    <ChevronRight size={scaled(16)} color={colors.neutral.brown} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day Headers (Su, Mo, Tu, ...) */}
              <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map((d) => (
                  <Text key={d} style={[styles.weekDayText, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day Grid */}
              <View style={styles.daysGrid}>
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const formattedMonth = String(month + 1).padStart(2, '0');
                  const formattedDay = String(day).padStart(2, '0');
                  const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

                  const hasLogs = loggedDatesMap[dateKey];
                  const isSelected = selectedDateKey === dateKey;
                  const isToday =
                    day === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: colors.sage.base },
                        isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.sage.base },
                      ]}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: colors.neutral.brown, fontSize: scaled(13) },
                          isSelected && { color: '#FFFFFF' },
                          isToday && !isSelected && { color: colors.sage.dark },
                        ]}
                      >
                        {day}
                      </Text>
                      {hasLogs && !isSelected && (
                        <View style={[styles.logDot, { backgroundColor: colors.terracotta.base }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category Filter Pills */}
            <View style={styles.filterWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {CATEGORY_FILTERS.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterPill,
                        { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
                        isSelected && {
                          backgroundColor: isDarkMode ? colors.terracotta.base : '#3E2D1E',
                          borderColor: isDarkMode ? colors.terracotta.base : '#3E2D1E',
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          { color: colors.neutral.brown, fontSize: scaled(13) },
                          isSelected && { color: '#FFFFFF' },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Timeline Log Groups */}
            {Object.keys(filteredAndGroupedSymptoms).length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
                <CalendarIcon size={scaled(32)} color={colors.neutral.muted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: colors.neutral.brown, fontSize: scaled(18) }]}>
                  No Entries Found
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.neutral.muted, fontSize: scaled(13) }]}>
                  {selectedDateKey
                    ? 'No symptoms logged for this date.'
                    : 'Tap "+ Log" below to record your first symptom.'}
                </Text>
                <TouchableOpacity
                  style={[styles.logNowBtn, { backgroundColor: colors.terracotta.base }]}
                  onPress={() => router.push('/(tabs)/log' as any)}
                  activeOpacity={0.8}
                >
                  <Plus size={scaled(16)} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.logNowText, { fontSize: scaled(13) }]}>Log a Symptom</Text>
                </TouchableOpacity>
              </View>
            ) : (
              Object.entries(filteredAndGroupedSymptoms).map(([groupTitle, logs]) => (
                <View key={groupTitle} style={styles.groupSection}>
                  <Text style={[styles.groupHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                    {groupTitle}
                  </Text>

                  {logs.map((symptom) => {
                    const categories = getCategoriesFromDesc(symptom.description);
                    const primaryCategory = categories[0] || 'General';
                    const dotColor = (categoryDotColors as any)[primaryCategory] || colors.neutral.muted;

                    const timeFormatted = symptom.created_at
                      ? parseTimestamp(symptom.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : symptom.time_of_day || '';

                    return (
                      <View key={symptom.id} style={styles.timelineItemRow}>
                        {/* Vertical Timeline Guide & Dot */}
                        <View style={styles.timelineGuideContainer}>
                          <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                          <View style={[styles.timelineLine, { backgroundColor: isDarkMode ? '#332D28' : '#EDE5D8' }]} />
                        </View>

                        {/* Symptom Card */}
                        <TouchableOpacity
                          style={[styles.symptomCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}
                          onLongPress={() => handleDeleteLog(symptom.id, symptom.description || 'Symptom')}
                          activeOpacity={0.9}
                        >
                          <View style={styles.symptomCardTop}>
                            <Text style={[styles.symptomTitle, { color: colors.neutral.brown, fontSize: scaled(14.5) }]}>
                              {symptom.description}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {categories.map((catName) => {
                                const badgeStyle = (categoryBadgeStyles as any)[catName] || (categoryBadgeStyles as any).General;
                                return (
                                  <View key={catName} style={[styles.categoryBadge, { backgroundColor: badgeStyle.bg }]}>
                                    <Text style={[styles.categoryBadgeText, { color: badgeStyle.text, fontSize: scaled(10.5) }]}>
                                      {catName}
                                    </Text>
                                  </View>
                                );
                              })}
                              <TouchableOpacity
                                onPress={() => handleDeleteLog(symptom.id, symptom.description || 'Symptom')}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={{ padding: 2 }}
                              >
                                <Trash2 size={scaled(13)} color={colors.neutral.muted} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.symptomCardBottom}>
                            <View style={styles.timeRow}>
                              <Clock size={scaled(12)} color={colors.neutral.muted} style={{ marginRight: 4 }} />
                              <Text style={[styles.symptomTimeText, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                                {timeFormatted}
                              </Text>
                            </View>

                            {symptom.severity !== undefined && symptom.severity !== null && (
                              <Text style={styles.severityText}>
                                <Text style={[styles.severityNumber, { color: colors.terracotta.base, fontSize: scaled(14) }]}>
                                  {symptom.severity}
                                </Text>
                                <Text style={[styles.severityMax, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                                  /10
                                </Text>
                              </Text>
                            )}
                          </View>

                          {/* Triggers if present */}
                          {symptom.triggers && symptom.triggers.length > 0 && (
                            <View style={[styles.triggersWrap, { borderTopColor: isDarkMode ? '#2D2824' : '#F3EDE4' }]}>
                              {symptom.triggers.map((t: any, idx: number) => (
                                <View key={idx} style={[styles.triggerChip, { backgroundColor: isDarkMode ? '#332D28' : '#F6F0E8' }]}>
                                  <Text style={[styles.triggerChipText, { color: colors.neutral.brownMid, fontSize: scaled(10.5) }]}>
                                    {t.trigger_value || t.trigger_type}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}

                          {/* Notes / mood text if present */}
                          {!!symptom.mood && (
                            <View style={[styles.notesWrap, { borderTopColor: isDarkMode ? '#2D2824' : '#F3EDE4' }]}>
                              <FileText size={scaled(11)} color={colors.neutral.muted} style={{ marginRight: 4, marginTop: 1 }} />
                              <Text style={[styles.notesText, { color: colors.neutral.brownMid, fontSize: scaled(12) }]}>
                                {symptom.mood}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  calendarCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calendarMonthText: {
    fontFamily: 'Nunito-Bold',
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 8,
  },
  calNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontFamily: 'Nunito-Bold',
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
    borderRadius: 17,
  },
  dayText: {
    fontFamily: 'Nunito-Bold',
  },
  logDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 2,
  },
  filterWrapper: {
    marginBottom: Spacing.md,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontFamily: 'Nunito-Bold',
  },
  groupSection: {
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  timelineItemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineGuideContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 6,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: 18,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    marginTop: 4,
  },
  symptomCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  symptomCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  symptomTitle: {
    flex: 1,
    fontFamily: 'Nunito-Bold',
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: 'Nunito-Bold',
  },
  symptomCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomTimeText: {
    fontFamily: 'Nunito-Medium',
  },
  severityText: {
    fontFamily: 'Nunito-Bold',
  },
  severityNumber: {
    fontFamily: 'Nunito-Bold',
  },
  severityMax: {
    fontFamily: 'Nunito-Medium',
  },
  triggersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  triggerChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  triggerChipText: {
    fontFamily: 'Nunito-Medium',
  },
  notesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  notesText: {
    flex: 1,
    fontFamily: 'Nunito-Medium',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  emptyCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginVertical: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    marginBottom: 4,
  },
  emptySubtext: {
    fontFamily: 'Nunito-Medium',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  logNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  logNowText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});