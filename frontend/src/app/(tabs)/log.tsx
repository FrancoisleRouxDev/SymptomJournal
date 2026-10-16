import React, { useState, useRef, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Keyboard,
  PanResponder,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Zap,
  Moon,
  Cloud,
  Leaf,
  Wind,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Check,
  Plus,
  X,
  MapPin,
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import api from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

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

// ── Base Body Areas ───────────────────────────────────────────
const BASE_BODY_AREAS = [
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
  type: 'sleep' | 'stress' | 'food' | 'exercise' | 'weather' | 'other' | 'custom';
}

const BASE_TRIGGER_OPTIONS: TriggerOption[] = [
  { id: 'stress', label: 'Stress', type: 'stress' },
  { id: 'poor_sleep', label: 'Poor Sleep', type: 'sleep' },
  { id: 'food', label: 'Diet / Food', type: 'food' },
  { id: 'screen_time', label: 'Screen Time', type: 'other' },
  { id: 'weather', label: 'Weather', type: 'weather' },
  { id: 'exercise', label: 'Exertion', type: 'exercise' },
  { id: 'caffeine', label: 'Caffeine', type: 'food' },
];

const STORAGE_CUSTOM_AREAS = '@symptomjournal_custom_body_areas';
const STORAGE_CUSTOM_TRIGGERS = '@symptomjournal_custom_triggers';

export default function LogScreen() {
  const router = useRouter();
  const { colors, isDarkMode, scaled } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Form states with multi-select support
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['pain']);
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>(['Head']);
  const [severity, setSeverity] = useState<number>(5);
  const [timePreset, setTimePreset] = useState<TimePreset>('now');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  // Custom Areas & Triggers State
  const [customBodyAreas, setCustomBodyAreas] = useState<string[]>([]);
  const [customTriggers, setCustomTriggers] = useState<string[]>([]);

  // Modals
  const [isAreaModalVisible, setIsAreaModalVisible] = useState(false);
  const [selectedParentRegion, setSelectedParentRegion] = useState<string>('Head');
  const [customAreaInput, setCustomAreaInput] = useState('');

  const [isTriggerModalVisible, setIsTriggerModalVisible] = useState(false);
  const [customTriggerInput, setCustomTriggerInput] = useState('');

  // Slider gesture support
  const sliderContainerWidth = useRef<number>(0);

  const clampSeverity = (val: number) => Math.min(10, Math.max(1, Math.round(val)));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const w = sliderContainerWidth.current;
        if (w > 0) {
          const ratio = Math.max(0, Math.min(1, x / w));
          setSeverity(clampSeverity(1 + ratio * 9));
        }
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const w = sliderContainerWidth.current;
        if (w > 0) {
          const ratio = Math.max(0, Math.min(1, x / w));
          setSeverity(clampSeverity(1 + ratio * 9));
        }
      },
    })
  ).current;

  // Load custom body areas and triggers from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const savedAreas = await AsyncStorage.getItem(STORAGE_CUSTOM_AREAS);
        if (savedAreas) {
          setCustomBodyAreas(JSON.parse(savedAreas));
        }
        const savedTriggers = await AsyncStorage.getItem(STORAGE_CUSTOM_TRIGGERS);
        if (savedTriggers) {
          setCustomTriggers(JSON.parse(savedTriggers));
        }
      } catch (err) {
        console.log('Error loading custom areas/triggers:', err);
      }
    })();
  }, []);

  // Listen to keyboard show/hide to smoothly expand scroll padding
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Multi-select toggle helpers
  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleBodyArea = (area: string) => {
    setSelectedBodyAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleTrigger = (trigId: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigId) ? prev.filter((t) => t !== trigId) : [...prev, trigId]
    );
  };

  // Add Custom Body Area
  const handleAddCustomArea = async () => {
    const trimmed = customAreaInput.trim();
    if (!trimmed) {
      Alert.alert('Missing Detail', 'Please enter a specific body area or part.');
      return;
    }

    const finalName =
      selectedParentRegion && selectedParentRegion !== 'None'
        ? `${selectedParentRegion}: ${trimmed}`
        : trimmed;

    if (!customBodyAreas.includes(finalName) && !BASE_BODY_AREAS.includes(finalName)) {
      const updated = [...customBodyAreas, finalName];
      setCustomBodyAreas(updated);
      try {
        await AsyncStorage.setItem(STORAGE_CUSTOM_AREAS, JSON.stringify(updated));
      } catch (err) {
        console.log('Error saving custom area:', err);
      }
    }

    // Auto-select
    if (!selectedBodyAreas.includes(finalName)) {
      setSelectedBodyAreas((prev) => [...prev, finalName]);
    }

    setCustomAreaInput('');
    setIsAreaModalVisible(false);
  };

  // Add Custom Trigger
  const handleAddCustomTrigger = async () => {
    const trimmed = customTriggerInput.trim();
    if (!trimmed) {
      Alert.alert('Missing Trigger', 'Please enter a trigger name.');
      return;
    }

    if (!customTriggers.includes(trimmed)) {
      const updated = [...customTriggers, trimmed];
      setCustomTriggers(updated);
      try {
        await AsyncStorage.setItem(STORAGE_CUSTOM_TRIGGERS, JSON.stringify(updated));
      } catch (err) {
        console.log('Error saving custom trigger:', err);
      }
    }

    // Auto-select
    if (!selectedTriggers.includes(trimmed)) {
      setSelectedTriggers((prev) => [...prev, trimmed]);
    }

    setCustomTriggerInput('');
    setIsTriggerModalVisible(false);
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
    if (val <= 3) return colors.sage.base;
    if (val <= 7) return '#E8B87A';
    return colors.terracotta.base;
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Missing Category', 'Please select at least one symptom category.');
      return;
    }

    if (selectedBodyAreas.length === 0) {
      Alert.alert('Missing Body Area', 'Please select at least one body area.');
      return;
    }

    setLoading(true);

    try {
      const categoryNames = selectedCategories
        .map((cId) => CATEGORIES.find((c) => c.id === cId)?.name)
        .filter(Boolean)
        .join(', ');

      const bodyAreaNames = selectedBodyAreas.join(', ');
      const description = `${categoryNames} (${bodyAreaNames})`;

      // Format triggers (base + custom)
      const triggersPayload = selectedTriggers.map((tId) => {
        const baseTrig = BASE_TRIGGER_OPTIONS.find((o) => o.id === tId);
        if (baseTrig) {
          return {
            trigger_type: baseTrig.type,
            trigger_value: baseTrig.label,
          };
        }
        return {
          trigger_type: 'custom',
          trigger_value: tId,
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
        setNotes('');
        setSelectedTriggers([]);
        setSelectedCategories(['pain']);
        setSelectedBodyAreas(['Head']);
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.canvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDarkMode ? colors.neutral.border : '#EAE1D5' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={scaled(22)} color={colors.neutral.brown} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.neutral.brown, fontSize: scaled(26) }]}>
            Log a Symptom
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={[
            styles.scrollContent,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + 80 },
          ]}
        >
          {/* CATEGORY SECTION (Multi-Select) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeader, styles.sectionHeaderInRow, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              CATEGORY
            </Text>
            <Text style={[styles.sectionHeaderSub, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              Select all that apply
            </Text>
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const IconComp = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
                    isSelected && {
                      backgroundColor: cat.accentColor,
                      borderColor: cat.accentColor,
                      shadowColor: cat.accentColor,
                      shadowOpacity: 0.35,
                      elevation: 3,
                    },
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.categoryCardTop}>
                    <IconComp
                      size={scaled(20)}
                      color={isSelected ? '#FFFFFF' : cat.accentColor}
                    />
                    {isSelected && <Check size={scaled(14)} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text
                    style={[
                      styles.categoryText,
                      { color: colors.neutral.brown, fontSize: scaled(13) },
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* BODY AREA SECTION (Multi-Select + Custom Specific Areas) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeader, styles.sectionHeaderInRow, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              BODY AREA
            </Text>
            <Text style={[styles.sectionHeaderSub, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              Select regions or add specific locations
            </Text>
          </View>
          <View style={styles.pillContainer}>
            {/* Base areas */}
            {BASE_BODY_AREAS.map((area) => {
              const isSelected = selectedBodyAreas.includes(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.areaPill,
                    { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
                    isSelected && { backgroundColor: colors.sage.dark, borderColor: colors.sage.dark },
                  ]}
                  onPress={() => toggleBodyArea(area)}
                  activeOpacity={0.8}
                >
                  <View style={styles.areaPillIconRow}>
                    {isSelected ? (
                      <Check size={scaled(12)} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Plus size={scaled(12)} color={colors.neutral.brownMid} strokeWidth={2} />
                    )}
                    <Text
                      style={[
                        styles.areaPillText,
                        { color: colors.neutral.brown, fontSize: scaled(13) },
                        isSelected && styles.areaPillTextSelected,
                      ]}
                    >
                      {area}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Custom Added Specific Areas */}
            {customBodyAreas.map((customArea) => {
              const isSelected = selectedBodyAreas.includes(customArea);
              return (
                <TouchableOpacity
                  key={customArea}
                  style={[
                    styles.areaPill,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.sage.base,
                      borderStyle: 'dashed',
                    },
                    isSelected && {
                      backgroundColor: colors.sage.dark,
                      borderColor: colors.sage.dark,
                      borderStyle: 'solid',
                    },
                  ]}
                  onPress={() => toggleBodyArea(customArea)}
                  activeOpacity={0.8}
                >
                  <View style={styles.areaPillIconRow}>
                    {isSelected ? (
                      <Check size={scaled(12)} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <MapPin size={scaled(12)} color={colors.sage.dark} />
                    )}
                    <Text
                      style={[
                        styles.areaPillText,
                        { color: colors.neutral.brown, fontSize: scaled(13) },
                        isSelected && styles.areaPillTextSelected,
                      ]}
                    >
                      {customArea}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Button: + Add Specific / Custom Area */}
            <TouchableOpacity
              style={[
                styles.addCustomPill,
                { backgroundColor: colors.sage.tint, borderColor: colors.sage.base },
              ]}
              onPress={() => setIsAreaModalVisible(true)}
              activeOpacity={0.7}
            >
              <Plus size={scaled(13)} color={colors.sage.dark} style={{ marginRight: 4 }} />
              <Text style={[styles.addCustomText, { color: colors.sage.dark, fontSize: scaled(12.5) }]}>
                Specific Area...
              </Text>
            </TouchableOpacity>
          </View>

          {/* SEVERITY CARD */}
          <View style={[styles.severityCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
            <View style={styles.severityHeaderRow}>
              <Text style={[styles.severityLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                SEVERITY
              </Text>
              <Text style={styles.severityValueText}>
                <Text style={{ color: getSeverityColor(severity), fontSize: scaled(18), fontFamily: 'Nunito-Bold' }}>
                  {severity}
                </Text>
                <Text style={{ color: colors.neutral.muted, fontSize: scaled(14), fontFamily: 'Nunito-Bold' }}>
                  /10
                </Text>
              </Text>
            </View>

            {/* Drag-able + tappable severity track */}
            <View
              style={styles.stepTrackContainer}
              onLayout={(e) => {
                sliderContainerWidth.current = e.nativeEvent.layout.width;
              }}
              {...panResponder.panHandlers}
            >
              {/* Step buttons */}
              <View style={styles.steppedNumbersRow} pointerEvents="box-none">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isCurrent = severity === num;
                  const stepColor = getSeverityColor(num);
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.stepButton,
                        { backgroundColor: isDarkMode ? '#332D28' : '#EDE5D8' },
                        isCurrent && { backgroundColor: stepColor, borderColor: stepColor },
                      ]}
                      onPress={() => setSeverity(num)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.stepButtonText,
                          { color: colors.neutral.brownMid, fontSize: scaled(11) },
                          isCurrent && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Progress Track */}
              <View style={[styles.progressTrackBg, { backgroundColor: isDarkMode ? '#332D28' : '#EDE5D8' }]}>
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
                <Text style={[styles.severitySubLabel, { color: colors.sage.base, fontSize: scaled(11) }]}>Mild</Text>
                <Text style={[styles.severitySubLabel, { color: '#E8B87A', fontSize: scaled(11) }]}>Moderate</Text>
                <Text style={[styles.severitySubLabel, { color: colors.terracotta.base, fontSize: scaled(11) }]}>Severe</Text>
              </View>
            </View>
          </View>

          {/* WHEN DID IT START? */}
          <Text style={[styles.sectionHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
            WHEN DID IT START?
          </Text>
          <View style={styles.timePillRow}>
            {TIME_PRESETS.map((preset) => {
              const isSelected = timePreset === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.timePill,
                    { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
                    isSelected && {
                      backgroundColor: isDarkMode ? colors.terracotta.base : '#3E2D1E',
                      borderColor: isDarkMode ? colors.terracotta.base : '#3E2D1E',
                    },
                  ]}
                  onPress={() => setTimePreset(preset)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timePillText,
                      { color: colors.neutral.brown, fontSize: scaled(13) },
                      isSelected && styles.timePillTextSelected,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* POTENTIAL TRIGGERS (OPTIONAL + CUSTOM TRIGGERS) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeader, styles.sectionHeaderInRow, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              POTENTIAL TRIGGERS (OPTIONAL)
            </Text>
            <Text style={[styles.sectionHeaderSub, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              Select or add triggers
            </Text>
          </View>
          <View style={styles.pillContainer}>
            {/* Base triggers */}
            {BASE_TRIGGER_OPTIONS.map((trig) => {
              const isSelected = selectedTriggers.includes(trig.id);
              return (
                <TouchableOpacity
                  key={trig.id}
                  style={[
                    styles.triggerPill,
                    { backgroundColor: colors.background.card, borderColor: colors.neutral.border },
                    isSelected && {
                      backgroundColor: isDarkMode ? '#3D251C' : colors.terracotta.tint,
                      borderColor: colors.terracotta.light,
                    },
                  ]}
                  onPress={() => toggleTrigger(trig.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.areaPillIconRow}>
                    {isSelected ? (
                      <Check size={scaled(12)} color={colors.terracotta.dark} strokeWidth={3} />
                    ) : (
                      <Plus size={scaled(12)} color={colors.neutral.brownMid} strokeWidth={2} />
                    )}
                    <Text
                      style={[
                        styles.triggerPillText,
                        { color: colors.neutral.brownMid, fontSize: scaled(12) },
                        isSelected && { color: colors.terracotta.dark },
                      ]}
                    >
                      {trig.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Custom Triggers */}
            {customTriggers.map((cTrig) => {
              const isSelected = selectedTriggers.includes(cTrig);
              return (
                <TouchableOpacity
                  key={cTrig}
                  style={[
                    styles.triggerPill,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.terracotta.base,
                      borderStyle: 'dashed',
                    },
                    isSelected && {
                      backgroundColor: isDarkMode ? '#3D251C' : colors.terracotta.tint,
                      borderColor: colors.terracotta.light,
                      borderStyle: 'solid',
                    },
                  ]}
                  onPress={() => toggleTrigger(cTrig)}
                  activeOpacity={0.8}
                >
                  <View style={styles.areaPillIconRow}>
                    {isSelected ? (
                      <Check size={scaled(12)} color={colors.terracotta.dark} strokeWidth={3} />
                    ) : (
                      <Sparkles size={scaled(11)} color={colors.terracotta.base} />
                    )}
                    <Text
                      style={[
                        styles.triggerPillText,
                        { color: colors.neutral.brownMid, fontSize: scaled(12) },
                        isSelected && { color: colors.terracotta.dark },
                      ]}
                    >
                      {cTrig}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Button: + Custom Trigger */}
            <TouchableOpacity
              style={[
                styles.addCustomPill,
                { backgroundColor: colors.terracotta.tint, borderColor: colors.terracotta.base },
              ]}
              onPress={() => setIsTriggerModalVisible(true)}
              activeOpacity={0.7}
            >
              <Plus size={scaled(13)} color={colors.terracotta.dark} style={{ marginRight: 4 }} />
              <Text style={[styles.addCustomText, { color: colors.terracotta.dark, fontSize: scaled(12.5) }]}>
                Add Trigger...
              </Text>
            </TouchableOpacity>
          </View>

          {/* NOTES (OPTIONAL) */}
          <Text style={[styles.sectionHeader, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
            NOTES (OPTIONAL)
          </Text>
          <View style={[styles.notesContainer, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.neutral.brown, fontSize: scaled(14) }]}
              placeholder="Describe how you feel, any triggers you noticed..."
              placeholderTextColor={colors.neutral.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.terracotta.base },
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || loggedSuccess}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : loggedSuccess ? (
              <View style={styles.successRow}>
                <CheckCircle2 size={scaled(18)} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.submitButtonText, { fontSize: scaled(16) }]}>Symptom Logged!</Text>
              </View>
            ) : (
              <Text style={[styles.submitButtonText, { fontSize: scaled(16) }]}>Log Symptom</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>

      {/* MODAL: ADD SPECIFIC BODY AREA */}
      <Modal
        visible={isAreaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAreaModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.neutral.brown, fontSize: scaled(18) }]}>
                Add Specific Body Area
              </Text>
              <TouchableOpacity onPress={() => setIsAreaModalVisible(false)} style={{ padding: 4 }}>
                <X size={scaled(20)} color={colors.neutral.muted} />
              </TouchableOpacity>
            </View>

            {/* Region Chip Picker */}
            <Text style={[styles.modalLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
              SELECT PARENT REGION (OPTIONAL):
            </Text>
            <View style={styles.regionChipContainer}>
              {['Head', 'Neck', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'None'].map((region) => {
                const isSelected = selectedParentRegion === region;
                return (
                  <TouchableOpacity
                    key={region}
                    style={[
                      styles.regionChip,
                      { backgroundColor: colors.background.cream, borderColor: colors.neutral.border },
                      isSelected && { backgroundColor: colors.sage.dark, borderColor: colors.sage.dark },
                    ]}
                    onPress={() => setSelectedParentRegion(region)}
                  >
                    <Text
                      style={[
                        styles.regionChipText,
                        { color: colors.neutral.brown, fontSize: scaled(11.5) },
                        isSelected && { color: '#FFFFFF', fontFamily: 'Nunito-Bold' },
                      ]}
                    >
                      {region}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Specific sub-location input */}
            <View style={styles.modalFieldGroup}>
              <Text style={[styles.modalLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                SPECIFIC LOCATION / PART:
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                    borderColor: colors.neutral.border,
                    color: colors.neutral.brown,
                    fontSize: scaled(14),
                  },
                ]}
                value={customAreaInput}
                onChangeText={setCustomAreaInput}
                placeholder="e.g. Temples, Lower Right, Behind Eye, Knee"
                placeholderTextColor={colors.neutral.muted}
                autoFocus
              />
              <Text style={[styles.previewHint, { color: colors.neutral.muted, fontSize: scaled(11.5) }]}>
                Preview: {selectedParentRegion !== 'None' ? `${selectedParentRegion}: ` : ''}
                {customAreaInput.trim() || '...'}
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.neutral.border }]}
                onPress={() => setIsAreaModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral.muted, fontSize: scaled(14) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.sage.dark }]}
                onPress={handleAddCustomArea}
              >
                <Text style={[styles.modalSaveText, { fontSize: scaled(14) }]}>Add Area</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD CUSTOM TRIGGER */}
      <Modal
        visible={isTriggerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTriggerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.neutral.brown, fontSize: scaled(18) }]}>
                Add Custom Trigger
              </Text>
              <TouchableOpacity onPress={() => setIsTriggerModalVisible(false)} style={{ padding: 4 }}>
                <X size={scaled(20)} color={colors.neutral.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={[styles.modalLabel, { color: colors.neutral.muted, fontSize: scaled(11) }]}>
                TRIGGER NAME:
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? '#1E1A17' : '#FBF8F3',
                    borderColor: colors.neutral.border,
                    color: colors.neutral.brown,
                    fontSize: scaled(14),
                  },
                ]}
                value={customTriggerInput}
                onChangeText={setCustomTriggerInput}
                placeholder="e.g. Dairy, Gluten, Loud Music, Dehydration"
                placeholderTextColor={colors.neutral.muted}
                autoFocus
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.neutral.border }]}
                onPress={() => setIsTriggerModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral.muted, fontSize: scaled(14) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.terracotta.base }]}
                onPress={handleAddCustomTrigger}
              >
                <Text style={[styles.modalSaveText, { fontSize: scaled(14) }]}>Add Trigger</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionHeaderInRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  sectionHeaderSub: {
    fontFamily: 'Nunito-Medium',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  categoryCard: {
    width: '31%',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryText: {
    fontFamily: 'Nunito-Bold',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  areaPill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: '#3E2D1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  areaPillIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  areaPillText: {
    fontFamily: 'Nunito-Bold',
  },
  areaPillTextSelected: {
    color: '#FFFFFF',
  },
  addCustomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addCustomText: {
    fontFamily: 'Nunito-Bold',
  },
  triggerPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  triggerPillText: {
    fontFamily: 'Nunito-Bold',
  },
  severityCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonText: {
    fontFamily: 'Nunito-Bold',
  },
  progressTrackBg: {
    height: 8,
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
  },
  timePillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  timePill: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  timePillText: {
    fontFamily: 'Nunito-Bold',
  },
  timePillTextSelected: {
    color: '#FFFFFF',
  },
  notesContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  notesInput: {
    fontFamily: 'Nunito-Medium',
    minHeight: 70,
  },
  submitButton: {
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
  },
  modalLabel: {
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  regionChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  regionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  regionChipText: {
    fontFamily: 'Nunito-Medium',
  },
  modalFieldGroup: {
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'Nunito-Medium',
  },
  previewHint: {
    fontFamily: 'Nunito-Medium',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modalCancelText: {
    fontFamily: 'Nunito-Bold',
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});