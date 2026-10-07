import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Zap,
  Moon,
  Cloud,
  Leaf,
  Wind,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import api from '@/lib/api';

// ── Categories ────────────────────────────────────────────────
interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  accentColor: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'pain', name: 'Pain', icon: Zap, accentColor: Colors.terracotta.base },
  { id: 'fatigue', name: 'Fatigue', icon: Moon, accentColor: '#E8B87A' },
  { id: 'mood', name: 'Mood', icon: Cloud, accentColor: '#B8A0D0' },
  { id: 'digestion', name: 'Digestion', icon: Leaf, accentColor: '#7B9E87' },
  { id: 'breathing', name: 'Breathing', icon: Wind, accentColor: '#7AAED0' },
  { id: 'skin', name: 'Skin', icon: Sparkles, accentColor: '#E8A0A0' },
];

// ── Body Areas ────────────────────────────────────────────────
const BODY_AREAS = [
  'Head',
  'Neck',
  'Chest',
  'Abdomen',
  'Back',
  'Arms',
  'Legs',
  'General',
];

// ── Time Presets ──────────────────────────────────────────────
type TimePreset = 'now' | '1h ago' | '3h ago' | 'earlier';
const TIME_PRESETS: TimePreset[] = ['now', '1h ago', '3h ago', 'earlier'];

// ── Common Triggers ───────────────────────────────────────────
interface TriggerOption {
  id: string;
  label: string;
  type: 'sleep' | 'stress' | 'food' | 'exercise' | 'weather' | 'other';
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  { id: 'stress', label: 'Stress', type: 'stress' },
  { id: 'poor_sleep', label: 'Poor Sleep', type: 'sleep' },
  { id: 'food', label: 'Diet / Food', type: 'food' },
  { id: 'screen_time', label: 'Screen Time', type: 'other' },
  { id: 'weather', label: 'Weather', type: 'weather' },
  { id: 'exercise', label: 'Exertion', type: 'exercise' },
  { id: 'caffeine', label: 'Caffeine', type: 'food' },
];

export default function LogScreen() {
  const router = useRouter();

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>('pain');
  const [selectedBodyArea, setSelectedBodyArea] = useState<string>('Head');
  const [severity, setSeverity] = useState<number>(5);
  const [timePreset, setTimePreset] = useState<TimePreset>('now');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  // Toggle trigger selection
  const toggleTrigger = (triggerId: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(triggerId)
        ? prev.filter((id) => id !== triggerId)
        : [...prev, triggerId]
    );
  };

  // Convert time preset to backend-valid time_of_day ('morning' | 'afternoon' | 'evening' | 'night')
  const mapTimeToTimeOfDay = (preset: TimePreset): string => {
    const date = new Date();
    if (preset === '1h ago') date.setHours(date.getHours() - 1);
    else if (preset === '3h ago') date.setHours(date.getHours() - 3);
    else if (preset === 'earlier') date.setHours(date.getHours() - 6);

    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // Severity color helper
  const getSeverityColor = (val: number) => {
    if (val <= 3) return Colors.sage.base;
    if (val <= 7) return '#E8B87A';
    return Colors.terracotta.base;
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a symptom category.');
      return;
    }

    setLoading(true);

    try {
      const activeCat = CATEGORIES.find((c) => c.id === selectedCategory);
      const categoryName = activeCat ? activeCat.name : 'General Symptom';

      // Build description format: "Category - Body Area" or custom
      const description = `${categoryName} (${selectedBodyArea})`;

      // Format triggers according to backend TriggerCreate schema
      const triggersPayload = selectedTriggers.map((tId) => {
        const trig = TRIGGER_OPTIONS.find((o) => o.id === tId);
        return {
          trigger_type: trig ? trig.type : 'other',
          trigger_value: trig ? trig.label : tId,
        };
      });

      const payload = {
        description,
        severity,
        time_of_day: mapTimeToTimeOfDay(timePreset),
        mood: notes.trim() || undefined,
        triggers: triggersPayload,
      };

      await api.post('/symptoms/log', payload);

      setLoggedSuccess(true);
      setTimeout(() => {
        setLoggedSuccess(false);
        // Reset form to defaults
        setNotes('');
        setSelectedTriggers([]);
        // Navigate to Timeline to see the new entry
        router.push('/(tabs)/timeline' as any);
      }, 1200);
    } catch (error: any) {
      console.log('Error logging symptom:', error);
      Alert.alert(
        'Logging Failed',
        error.response?.data?.detail || 'Could not save symptom log. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={Colors.neutral.brown} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log a Symptom</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* CATEGORY SECTION */}
          <Text style={styles.sectionHeader}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const IconComp = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && { backgroundColor: cat.accentColor, borderColor: cat.accentColor },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.85}
                >
                  <IconComp
                    size={22}
                    color={isSelected ? Colors.white : cat.accentColor}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* BODY AREA SECTION */}
          <Text style={styles.sectionHeader}>BODY AREA</Text>
          <View style={styles.pillContainer}>
            {BODY_AREAS.map((area) => {
              const isSelected = selectedBodyArea === area;
              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.areaPill,
                    isSelected && styles.areaPillSelected,
                  ]}
                  onPress={() => setSelectedBodyArea(area)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.areaPillText,
                      isSelected && styles.areaPillTextSelected,
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* SEVERITY CARD */}
          <View style={styles.severityCard}>
            <View style={styles.severityHeaderRow}>
              <Text style={styles.severityLabel}>SEVERITY</Text>
              <Text style={styles.severityValueText}>
                <Text style={{ color: getSeverityColor(severity), fontSize: 18 }}>{severity}</Text>
                <Text style={{ color: Colors.neutral.muted, fontSize: 14 }}>/10</Text>
              </Text>
            </View>

            {/* Interactive Step Buttons for 1 - 10 */}
            <View style={styles.stepTrackContainer}>
              <View style={styles.steppedNumbersRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isCurrent = severity === num;
                  const stepColor = getSeverityColor(num);
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.stepButton,
                        isCurrent && { backgroundColor: stepColor, borderColor: stepColor },
                      ]}
                      onPress={() => setSeverity(num)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.stepButtonText,
                          isCurrent && { color: Colors.white, fontWeight: '800' },
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Visual Gradient Progress Bar */}
              <View style={styles.progressTrackBg}>
                <View
                  style={[
                    styles.progressTrackFill,
                    {
                      width: `${(severity / 10) * 100}%`,
                      backgroundColor: getSeverityColor(severity),
                    },
                  ]}
                />
              </View>

              {/* Labels below slider */}
              <View style={styles.severityLabelsRow}>
                <Text style={[styles.severitySubLabel, { color: Colors.sage.base }]}>Mild</Text>
                <Text style={[styles.severitySubLabel, { color: '#E8B87A' }]}>Moderate</Text>
                <Text style={[styles.severitySubLabel, { color: Colors.terracotta.base }]}>Severe</Text>
              </View>
            </View>
          </View>

          {/* WHEN DID IT START? */}
          <Text style={styles.sectionHeader}>WHEN DID IT START?</Text>
          <View style={styles.timePillRow}>
            {TIME_PRESETS.map((preset) => {
              const isSelected = timePreset === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.timePill,
                    isSelected && styles.timePillSelected,
                  ]}
                  onPress={() => setTimePreset(preset)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timePillText,
                      isSelected && styles.timePillTextSelected,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* POTENTIAL TRIGGERS (OPTIONAL) */}
          <Text style={styles.sectionHeader}>POTENTIAL TRIGGERS (OPTIONAL)</Text>
          <View style={styles.pillContainer}>
            {TRIGGER_OPTIONS.map((trig) => {
              const isSelected = selectedTriggers.includes(trig.id);
              return (
                <TouchableOpacity
                  key={trig.id}
                  style={[
                    styles.triggerPill,
                    isSelected && styles.triggerPillSelected,
                  ]}
                  onPress={() => toggleTrigger(trig.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.triggerPillText,
                      isSelected && styles.triggerPillTextSelected,
                    ]}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {trig.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* NOTES (OPTIONAL) */}
          <Text style={styles.sectionHeader}>NOTES (OPTIONAL)</Text>
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Describe how you feel, any triggers you noticed..."
              placeholderTextColor={Colors.neutral.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || loggedSuccess}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : loggedSuccess ? (
              <View style={styles.successRow}>
                <CheckCircle2 size={18} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.submitButtonText}>Symptom Logged!</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Log Symptom</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAE1D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 26,
    color: Colors.neutral.brown,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    color: Colors.neutral.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  /* 3x2 Category Grid */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.neutral.brown,
  },
  categoryTextSelected: {
    color: Colors.white,
  },

  /* Body Area & Trigger Pills */
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  areaPill: {
    backgroundColor: Colors.background.card,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  areaPillSelected: {
    backgroundColor: Colors.sage.base,
    borderColor: Colors.sage.base,
  },
  areaPillText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.neutral.brown,
  },
  areaPillTextSelected: {
    color: Colors.white,
  },

  triggerPill: {
    backgroundColor: Colors.background.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  triggerPillSelected: {
    backgroundColor: Colors.terracotta.tint,
    borderColor: Colors.terracotta.light,
  },
  triggerPillText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    color: Colors.neutral.brownMid,
  },
  triggerPillTextSelected: {
    color: Colors.terracotta.dark,
  },

  /* Severity Card */
  severityCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  severityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  severityLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    color: Colors.neutral.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  severityValueText: {
    fontFamily: 'Nunito-Bold',
  },
  stepTrackContainer: {
    gap: 10,
  },
  steppedNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EDE5D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    color: Colors.neutral.brownMid,
  },
  progressTrackBg: {
    height: 8,
    backgroundColor: '#EDE5D8',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  severityLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severitySubLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
  },

  /* Time Preset Pills */
  timePillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  timePill: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  timePillSelected: {
    backgroundColor: '#3E2D1E',
    borderColor: '#3E2D1E',
  },
  timePillText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: Colors.neutral.brown,
  },
  timePillTextSelected: {
    color: Colors.white,
  },

  /* Notes Input */
  notesContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  notesInput: {
    fontFamily: 'Nunito-Medium',
    fontSize: 14,
    color: Colors.neutral.brown,
    minHeight: 70,
  },

  /* Submit Button */
  submitButton: {
    backgroundColor: Colors.terracotta.base,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.terracotta.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSize.button,
    color: Colors.white,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});