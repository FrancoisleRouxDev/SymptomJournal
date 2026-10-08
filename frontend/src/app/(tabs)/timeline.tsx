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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Trash2 } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

const CATEGORY_FILTERS = ['All', 'Pain', 'Fatigue', 'Mood', 'Digestion', 'Breathing', 'Skin'];

const CATEGORY_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  Pain: { bg: '#F5D8CC', text: Colors.terracotta.base },
  Fatigue: { bg: '#D4E7DC', text: Colors.sage.dark },
  Mood: { bg: '#EDE4F5', text: '#8A68B0' },
  Digestion: { bg: '#FBF0DE', text: '#B88232' },
  Breathing: { bg: '#DFEFFB', text: '#4585B5' },
  Skin: { bg: '#FCE7E7', text: '#C76363' },
  General: { bg: '#EDE5D8', text: Colors.neutral.brownMid },
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  Pain: Colors.terracotta.base,
  Fatigue: Colors.sage.base,
  Mood: '#B8A0D0',
  Digestion: '#E8B87A',
  Breathing: '#7AAED0',
  Skin: '#E8A0A0',
  General: Colors.neutral.muted,
};

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function TimelineScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

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


  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map symptoms to date keys: "YYYY-MM-DD"
  const loggedDatesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    symptoms.forEach((s) => {
      if (s.created_at) {
        const dKey = s.created_at.slice(0, 10);
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
    
    // Toggle date filter
    if (selectedDateKey === dateKey) {
      setSelectedDateKey(null);
    } else {
      setSelectedDateKey(dateKey);
    }
  };

  // Helper to detect category from description
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

  // Group symptoms by date
  const filteredAndGroupedSymptoms = useMemo(() => {
    // 1. Filter by category
    let list = symptoms;
    if (selectedCategory !== 'All') {
      list = list.filter((s) => getCategoryFromDesc(s.description) === selectedCategory);
    }

    // 2. Filter by selected calendar date if active
    if (selectedDateKey) {
      list = list.filter((s) => s.created_at && s.created_at.startsWith(selectedDateKey));
    }

    // 3. Group by date header
    const groups: Record<string, any[]> = {};
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    list.forEach((s) => {
      const dateStr = s.created_at ? s.created_at.slice(0, 10) : 'Unknown Date';
      let title = dateStr;

      if (dateStr === todayStr) {
        const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        title = `TODAY — ${formattedDate}`;
      } else if (dateStr === yesterdayStr) {
        const formattedDate = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        title = `YESTERDAY — ${formattedDate}`;
      } else if (s.created_at) {
        const d = new Date(s.created_at);
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Symptom Timeline</Text>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.sage.base} />
            <Text style={styles.loadingText}>Loading timeline...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSymptoms(true)} />}
          >
            {/* Calendar Card */}
            <View style={styles.calendarCard}>
              {/* Calendar Month Header */}
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarMonthText}>
                  {monthName} {year}
                </Text>
                <View style={styles.calendarNav}>
                  <TouchableOpacity style={styles.calNavBtn} onPress={handlePrevMonth}>
                    <ChevronLeft size={16} color={Colors.neutral.brown} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calNavBtn} onPress={handleNextMonth}>
                    <ChevronRight size={16} color={Colors.neutral.brown} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day Headers (Su, Mo, Tu, ...) */}
              <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map((d) => (
                  <Text key={d} style={styles.weekDayText}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day Grid */}
              <View style={styles.daysGrid}>
                {/* Empty slots before first day */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}

                {/* Days of month */}
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
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          isToday && !isSelected && styles.dayTextToday,
                        ]}
                      >
                        {day}
                      </Text>
                      {hasLogs && !isSelected && <View style={styles.logDot} />}
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
                      style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Timeline Log Groups */}
            {Object.keys(filteredAndGroupedSymptoms).length === 0 ? (
              <View style={styles.emptyCard}>
                <CalendarIcon size={32} color={Colors.neutral.muted} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No Entries Found</Text>
                <Text style={styles.emptySubtext}>
                  {selectedDateKey
                    ? 'No symptoms logged for this date.'
                    : 'Tap "+ Log" below to record your first symptom.'}
                </Text>
                <TouchableOpacity
                  style={styles.logNowBtn}
                  onPress={() => router.push('/(tabs)/log' as any)}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.logNowText}>Log a Symptom</Text>
                </TouchableOpacity>
              </View>
            ) : (
              Object.entries(filteredAndGroupedSymptoms).map(([groupTitle, logs]) => (
                <View key={groupTitle} style={styles.groupSection}>
                  <Text style={styles.groupHeader}>{groupTitle}</Text>

                  {logs.map((symptom) => {
                    const category = getCategoryFromDesc(symptom.description);
                    const badgeStyle = CATEGORY_BADGE_STYLES[category] || CATEGORY_BADGE_STYLES.General;
                    const dotColor = CATEGORY_DOT_COLORS[category] || CATEGORY_DOT_COLORS.General;

                    // Format time
                    const timeFormatted = symptom.created_at
                      ? new Date(symptom.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : symptom.time_of_day || '';

                    return (
                      <View key={symptom.id} style={styles.timelineItemRow}>
                        {/* Vertical Timeline Guide & Dot */}
                        <View style={styles.timelineGuideContainer}>
                          <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                          <View style={styles.timelineLine} />
                        </View>

                        {/* Symptom Card */}
                        <TouchableOpacity
                          style={styles.symptomCard}
                          onLongPress={() => handleDeleteLog(symptom.id, symptom.description || 'Symptom')}
                          activeOpacity={0.9}
                        >
                          <View style={styles.symptomCardTop}>
                            <Text style={styles.symptomTitle}>{symptom.description}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={[styles.categoryBadge, { backgroundColor: badgeStyle.bg }]}>
                                <Text style={[styles.categoryBadgeText, { color: badgeStyle.text }]}>
                                  {category}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => handleDeleteLog(symptom.id, symptom.description || 'Symptom')}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={{ padding: 2 }}
                              >
                                <Trash2 size={13} color={Colors.neutral.muted} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.symptomCardBottom}>
                            <View style={styles.timeRow}>
                              <Clock size={12} color={Colors.neutral.muted} style={{ marginRight: 4 }} />
                              <Text style={styles.symptomTimeText}>{timeFormatted}</Text>
                            </View>

                            {symptom.severity !== undefined && symptom.severity !== null && (
                              <Text style={styles.severityText}>
                                <Text style={styles.severityNumber}>{symptom.severity}</Text>
                                <Text style={styles.severityMax}>/10</Text>
                              </Text>
                            )}
                          </View>


                          {/* Triggers if present */}
                          {symptom.triggers && symptom.triggers.length > 0 && (
                            <View style={styles.triggersWrap}>
                              {symptom.triggers.map((t: any, idx: number) => (
                                <View key={idx} style={styles.triggerChip}>
                                  <Text style={styles.triggerChipText}>
                                    {t.trigger_value || t.trigger_type}
                                  </Text>
                                </View>
                              ))}
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
    backgroundColor: Colors.background.canvas,
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
    fontSize: 26,
    color: Colors.neutral.brown,
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

  /* Calendar Card */
  calendarCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EDE5D8',
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
    fontSize: 15,
    color: Colors.neutral.brown,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 8,
  },
  calNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3EDE4',
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
    fontSize: 11,
    color: Colors.neutral.muted,
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
  dayCellSelected: {
    backgroundColor: '#7B9E87',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#7B9E87',
  },
  dayText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.neutral.brown,
  },
  dayTextSelected: {
    color: Colors.white,
  },
  dayTextToday: {
    color: '#5A7D66',
  },
  logDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.terracotta.base,
    position: 'absolute',
    bottom: 2,
  },

  /* Filter Pills */
  filterWrapper: {
    marginBottom: Spacing.md,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    backgroundColor: Colors.background.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  filterPillSelected: {
    backgroundColor: '#3E2D1E',
    borderColor: '#3E2D1E',
  },
  filterPillText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.neutral.brown,
  },
  filterPillTextSelected: {
    color: Colors.white,
  },

  /* Timeline Groups */
  groupSection: {
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.neutral.muted,
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
    backgroundColor: '#E5DC CF',
    marginTop: 4,
  },
  symptomCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EDE5D8',
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
    fontSize: 14.5,
    color: Colors.neutral.brown,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10.5,
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
    fontSize: 12,
    color: Colors.neutral.muted,
  },
  severityText: {
    fontFamily: 'Nunito-Bold',
  },
  severityNumber: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: Colors.terracotta.base,
  },
  severityMax: {
    fontFamily: 'Nunito-Medium',
    fontSize: 11,
    color: Colors.neutral.muted,
  },
  triggersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3EDE4',
  },
  triggerChip: {
    backgroundColor: '#F6F0E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  triggerChipText: {
    fontFamily: 'Nunito-Medium',
    fontSize: 10.5,
    color: Colors.neutral.brownMid,
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE5D8',
    marginVertical: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 18,
    color: Colors.neutral.brown,
    marginBottom: 4,
  },
  emptySubtext: {
    fontFamily: 'Nunito-Medium',
    fontSize: 13,
    color: Colors.neutral.muted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  logNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.terracotta.base,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  logNowText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.white,
  },
});